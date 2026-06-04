"""
main.py
=======
FastAPI backend for TPRA ticket management.
"""

import asyncio
import base64
import json
import os
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, List

from dotenv import load_dotenv
load_dotenv(override=True)

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

# ── Config ────────────────────────────────────────────────────────────────────
WORKFLOW_DIR  = os.environ.get("WORKFLOW_DIR", str(Path.home() / "CMA_CGM/mistral/evaluation_risques"))
WORKFLOW_NAME = "tpra-evaluation"
DB_PATH       = "tickets.db"
UPLOAD_DIR    = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
ATTACHMENTS_DIR = Path("attachments")
ATTACHMENTS_DIR.mkdir(exist_ok=True)

app = FastAPI(title="TPRA Ticket Manager", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Database ──────────────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS tickets (
            id             TEXT PRIMARY KEY,
            vendor         TEXT NOT NULL,
            project        TEXT,
            analyst        TEXT,
            source_type    TEXT NOT NULL,
            filename       TEXT,
            file_path      TEXT,
            status         TEXT DEFAULT 'pending',
            execution_id   TEXT,
            result         TEXT,
            excel_path     TEXT,
            final_decision TEXT,
            validated_by   TEXT,
            created_at     TEXT,
            updated_at     TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS attachments (
            id           TEXT PRIMARY KEY,
            ticket_id    TEXT NOT NULL,
            question_id  TEXT NOT NULL,
            filename     TEXT NOT NULL,
            file_path    TEXT NOT NULL,
            uploaded_at  TEXT NOT NULL,
            FOREIGN KEY (ticket_id) REFERENCES tickets(id)
        )
    """)
    conn.commit()
    # Migration: add new columns if they don't exist in an existing DB
    for col, typ in [("final_decision", "TEXT"), ("validated_by", "TEXT")]:
        try:
            conn.execute(f"ALTER TABLE tickets ADD COLUMN {col} {typ}")
            conn.commit()
        except Exception:
            pass
    conn.close()

init_db()

# ── Models ────────────────────────────────────────────────────────────────────

class TicketSummary(BaseModel):
    id: str
    vendor: str
    project: Optional[str]
    analyst: Optional[str]
    source_type: str
    filename: Optional[str]
    status: str
    global_score: Optional[float] = None
    overall_score: Optional[str] = None
    final_decision: Optional[str] = None
    validated_by: Optional[str] = None
    created_at: str
    updated_at: str

class TicketDetail(TicketSummary):
    execution_id: Optional[str]
    result: Optional[dict]
    excel_path: Optional[str]

class ValidateRequest(BaseModel):
    approved: bool
    comments: Optional[str] = ""
    validated_by: Optional[str] = None   # nom de l'analyste humain

# ── Helpers ───────────────────────────────────────────────────────────────────

def _update_status(ticket_id: str, status: str, extra: dict = None):
    now = datetime.utcnow().isoformat()
    conn = get_db()
    if extra:
        conn.execute("""
            UPDATE tickets SET status=?, result=?, excel_path=?, updated_at=?
            WHERE id=?
        """, (status, json.dumps(extra.get("result")),
              extra.get("excel_path"), now, ticket_id))
    else:
        conn.execute("UPDATE tickets SET status=?, updated_at=? WHERE id=?",
                     (status, now, ticket_id))
    conn.commit()
    conn.close()

def _row_to_summary(r, res=None) -> TicketSummary:
    if res is None and r["result"]:
        try:
            res = json.loads(r["result"])
        except Exception:
            res = {}
    res = res or {}
    return TicketSummary(
        id=r["id"], vendor=r["vendor"], project=r["project"],
        analyst=r["analyst"], source_type=r["source_type"],
        filename=r["filename"], status=r["status"],
        global_score=res.get("global_score"),
        overall_score=res.get("overall_score"),
        final_decision=r["final_decision"] or res.get("final_decision"),
        validated_by=r["validated_by"],
        created_at=r["created_at"], updated_at=r["updated_at"],
    )

# ── Background workflow runner ─────────────────────────────────────────────────

async def _run_workflow(ticket_id: str, vendor: str, project: str,
                        analyst: str, source_type: str, content: str):
    input_data = json.dumps({
        "vendor": vendor, "project": project,
        "analyst": analyst, "source_type": source_type, "content": content,
    })
    cmd = [
        "python", "-m", "entrypoints.start",
        f"--workflow={WORKFLOW_NAME}",
        f"--input={input_data}",
    ]
    print(f"🚀 Launching workflow for ticket {ticket_id[:8]}...")
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=f"{WORKFLOW_DIR}/src",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env={**os.environ, "PYTHONPATH": f"{WORKFLOW_DIR}/src"},
        )
        stdout, stderr = await proc.communicate()
        output = stdout.decode("utf-8", errors="ignore")
        err    = stderr.decode("utf-8", errors="ignore")
        print(f"📤 Workflow stdout: {output[:500]}")
        if err:
            print(f"⚠️  Workflow stderr: {err[:300]}")

        result_dict = None
        excel_path  = None
        for line in output.splitlines():
            if line.startswith("Result:"):
                raw = line[len("Result:"):].strip()
                try:
                    outer = json.loads(raw.replace("'", '"'))
                    if isinstance(outer, dict) and "result" in outer:
                        inner = outer["result"]
                        result_dict = json.loads(inner) if isinstance(inner, str) else inner
                    else:
                        result_dict = outer
                    excel_path = result_dict.get("excel_path")
                except Exception:
                    import ast
                    try:
                        outer = ast.literal_eval(raw)
                        if isinstance(outer, dict) and "result" in outer:
                            inner = outer["result"]
                            result_dict = json.loads(inner) if isinstance(inner, str) else inner
                        else:
                            result_dict = outer
                        excel_path = result_dict.get("excel_path")
                    except Exception:
                        result_dict = {"raw": raw}
                break

        status = "completed" if result_dict else "error"
        if result_dict and result_dict.get("status") in ("rejected_by_analyst",):
            status = "rejected"

        # Pour une validation automatique par l'IA, on stocke "auto"
        final_decision = (result_dict or {}).get("final_decision")
        validated_by   = "auto"

    except Exception as e:
        print(f"❌ Workflow error: {e}")
        result_dict    = {"error": str(e)}
        excel_path     = None
        status         = "error"
        final_decision = None
        validated_by   = None

    now = datetime.utcnow().isoformat()
    conn = get_db()
    conn.execute("""
        UPDATE tickets
        SET status=?, result=?, excel_path=?, final_decision=?, validated_by=?, updated_at=?
        WHERE id=?
    """, (status, json.dumps(result_dict) if result_dict else None,
          excel_path, final_decision, validated_by, now, ticket_id))
    conn.commit()
    conn.close()
    print(f"✅ Ticket {ticket_id[:8]} → {status} | decision={final_decision} | by={validated_by}")


async def _run_workflow_with_validation(ticket_id: str, vendor: str, project: str,
                                         analyst: str, source_type: str, content: str):
    _update_status(ticket_id, "running")
    await _run_workflow(ticket_id, vendor, project, analyst, source_type, content)

# ── Routes ────────────────────────────────────────────────────────────────────

@app.post("/tickets", response_model=TicketSummary)
async def create_ticket(
    background_tasks: BackgroundTasks,
    vendor:  str        = Form(...),
    project: str        = Form("Not specified"),
    analyst: str        = Form("Analyst"),
    file:    UploadFile = File(...),
):
    filename      = file.filename or ""
    source_type   = "excel" if filename.endswith((".xlsx", ".xls")) \
                    else "pdf" if filename.endswith(".pdf") \
                    else "email"
    content_bytes = await file.read()
    content       = base64.b64encode(content_bytes).decode() \
                    if source_type in ("pdf", "excel") \
                    else content_bytes.decode("utf-8", errors="ignore")

    ticket_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{ticket_id}_{filename}"
    file_path.write_bytes(content_bytes)
    now = datetime.utcnow().isoformat()

    conn = get_db()
    conn.execute("""
        INSERT INTO tickets
        (id, vendor, project, analyst, source_type, filename, file_path,
         status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'running', ?, ?)
    """, (ticket_id, vendor, project, analyst, source_type,
          filename, str(file_path), now, now))
    conn.commit()
    conn.close()

    background_tasks.add_task(
        _run_workflow_with_validation,
        ticket_id, vendor, project, analyst, source_type, content
    )

    return TicketSummary(
        id=ticket_id, vendor=vendor, project=project, analyst=analyst,
        source_type=source_type, filename=filename, status="running",
        created_at=now, updated_at=now,
    )


@app.get("/tickets", response_model=list[TicketSummary])
async def list_tickets(status: Optional[str] = None):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM tickets WHERE status=? ORDER BY created_at DESC" if status
        else "SELECT * FROM tickets ORDER BY created_at DESC",
        (status,) if status else ()
    ).fetchall()
    conn.close()
    return [_row_to_summary(r) for r in rows]


@app.get("/tickets/{ticket_id}", response_model=TicketDetail)
async def get_ticket(ticket_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM tickets WHERE id=?", (ticket_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Ticket not found")

    result = None
    if row["result"]:
        try:
            result = json.loads(row["result"])
        except Exception:
            pass

    res = result or {}
    return TicketDetail(
        id=row["id"], vendor=row["vendor"], project=row["project"],
        analyst=row["analyst"], source_type=row["source_type"],
        filename=row["filename"], status=row["status"],
        execution_id=row["execution_id"],
        global_score=res.get("global_score"),
        overall_score=res.get("overall_score"),
        final_decision=row["final_decision"] or res.get("final_decision"),
        validated_by=row["validated_by"],
        result=result, excel_path=row["excel_path"],
        created_at=row["created_at"], updated_at=row["updated_at"],
    )


@app.post("/tickets/{ticket_id}/validate", response_model=TicketSummary)
async def validate_ticket(ticket_id: str, req: ValidateRequest):
    """
    Validation manuelle par un analyste humain.
    - approved=True  → final_decision="Approved", validated_by=nom_analyste
    - approved=False → final_decision="Rejected", validated_by=nom_analyste
    """
    conn = get_db()
    row = conn.execute("SELECT * FROM tickets WHERE id=?", (ticket_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(404, "Ticket not found")

    final_decision = "Approved" if req.approved else "Rejected"
    validated_by   = req.validated_by or row["analyst"] or "Analyste"
    status         = "completed" if req.approved else "rejected"
    now            = datetime.utcnow().isoformat()

    # Mettre à jour le result JSON aussi pour cohérence
    result = None
    if row["result"]:
        try:
            result = json.loads(row["result"])
        except Exception:
            result = {}
    result = result or {}
    result["final_decision"]  = final_decision
    result["validated_by"]    = validated_by
    result["analyst_comments"] = req.comments or ""

    conn.execute("""
        UPDATE tickets
        SET status=?, final_decision=?, validated_by=?, result=?, updated_at=?
        WHERE id=?
    """, (status, final_decision, validated_by, json.dumps(result), now, ticket_id))
    conn.commit()

    row = conn.execute("SELECT * FROM tickets WHERE id=?", (ticket_id,)).fetchone()
    conn.close()

    return _row_to_summary(row, result)


@app.get("/tickets/{ticket_id}/download")
async def download_excel(ticket_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM tickets WHERE id=?", (ticket_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Ticket not found")
    if not row["excel_path"]:
        raise HTTPException(404, "Excel not yet generated")
    path = Path(row["excel_path"])
    if not path.exists():
        raise HTTPException(404, "File not found on disk")
    return FileResponse(
        path=str(path),
        filename=f"TPRA_{row['vendor']}_{ticket_id[:8]}.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@app.delete("/tickets/{ticket_id}")
async def delete_ticket(ticket_id: str):
    """Supprime un ticket (admin uniquement)."""
    conn = get_db()
    row = conn.execute("SELECT * FROM tickets WHERE id=?", (ticket_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(404, "Ticket not found")
    conn.execute("DELETE FROM tickets WHERE id=?", (ticket_id,))
    conn.commit()
    conn.close()
    return {"deleted": ticket_id}


class PieceJointeAction(BaseModel):
    question_id: str
    action: str          # "uploaded" | "not_needed"
    comment: str = ""


@app.post("/tickets/{ticket_id}/piece-jointe")
async def handle_piece_jointe(ticket_id: str, req: PieceJointeAction):
    """
    Handles piece_jointe resolution for a question.
    action='uploaded'    → a PJ was uploaded, score +1 (capped at 4)
    action='not_needed'  → analyst declares no PJ needed, score +1 (capped at 4)
    Updates the question score in the stored result JSON.
    """
    conn = get_db()
    row = conn.execute("SELECT * FROM tickets WHERE id=?", (ticket_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(404, "Ticket not found")

    result = {}
    if row["result"]:
        try:
            result = json.loads(row["result"])
        except Exception:
            pass

    # Update the question score in question_scores list
    updated    = False
    new_score  = None
    question_scores = result.get("question_scores", [])

    for q in question_scores:
        if q.get("question_id") == req.question_id:
            old_score = q.get("score", 1)
            new_s     = 4
            q["score"]      = new_s
            q["pj_action"]  = req.action
            q["pj_comment"] = req.comment
            if req.action == "not_needed":
                q["piece_jointe_waived"] = True
            new_score = new_s
            updated = True
            break

    if not updated:
        conn.close()
        raise HTTPException(404, f"Question {req.question_id} not found in ticket results")

    # Recalculate global_score
    if question_scores:
        result["global_score"] = round(
            sum(q.get("score", 0) for q in question_scores) / len(question_scores), 2
        )

    result["question_scores"] = question_scores
    now = datetime.utcnow().isoformat()
    conn.execute("UPDATE tickets SET result=?, updated_at=? WHERE id=?",
                 (json.dumps(result), now, ticket_id))
    conn.commit()
    conn.close()

    return {
        "question_id": req.question_id,
        "action":      req.action,
        "new_score":   new_score,
        "global_score": result.get("global_score"),
    }


@app.post("/tickets/{ticket_id}/attachments")
async def upload_attachment(
    ticket_id: str,
    question_id: str = Form(...),
    file: UploadFile = File(...),
):
    """Upload a supporting document for a specific question."""
    conn = get_db()
    row = conn.execute("SELECT id FROM tickets WHERE id=?", (ticket_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(404, "Ticket not found")

    att_id    = str(uuid.uuid4())
    filename  = file.filename or "document"
    safe_name = f"{att_id}_{filename}"
    file_path = ATTACHMENTS_DIR / ticket_id
    file_path.mkdir(exist_ok=True)
    full_path = file_path / safe_name
    full_path.write_bytes(await file.read())
    now = datetime.utcnow().isoformat()

    conn.execute("""
        INSERT INTO attachments (id, ticket_id, question_id, filename, file_path, uploaded_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (att_id, ticket_id, question_id, filename, str(full_path), now))
    conn.commit()
    conn.close()

    return {"id": att_id, "ticket_id": ticket_id, "question_id": question_id,
            "filename": filename, "uploaded_at": now}


@app.get("/tickets/{ticket_id}/attachments")
async def list_attachments(ticket_id: str):
    """List all attachments for a ticket, grouped by question_id."""
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM attachments WHERE ticket_id=? ORDER BY uploaded_at DESC",
        (ticket_id,)
    ).fetchall()
    conn.close()
    return [{"id": r["id"], "ticket_id": r["ticket_id"], "question_id": r["question_id"],
             "filename": r["filename"], "uploaded_at": r["uploaded_at"]} for r in rows]


@app.get("/tickets/{ticket_id}/attachments/{att_id}/download")
async def download_attachment(ticket_id: str, att_id: str):
    """Download a specific attachment."""
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM attachments WHERE id=? AND ticket_id=?", (att_id, ticket_id)
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Attachment not found")
    path = Path(row["file_path"])
    if not path.exists():
        raise HTTPException(404, "File not found on disk")
    return FileResponse(path=str(path), filename=row["filename"])


@app.delete("/tickets/{ticket_id}/attachments/{att_id}")
async def delete_attachment(ticket_id: str, att_id: str):
    """Delete a specific attachment."""
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM attachments WHERE id=? AND ticket_id=?", (att_id, ticket_id)
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(404, "Attachment not found")
    try:
        Path(row["file_path"]).unlink(missing_ok=True)
    except Exception:
        pass
    conn.execute("DELETE FROM attachments WHERE id=?", (att_id,))
    conn.commit()
    conn.close()
    return {"deleted": att_id}


@app.get("/health")
async def health():
    return {"status": "ok", "workflow_dir": WORKFLOW_DIR}