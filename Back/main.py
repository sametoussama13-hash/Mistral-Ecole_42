"""
main.py
=======
FastAPI backend for TPRA ticket management.
Launches workflows via subprocess (same as `make execute`) — guaranteed to work.
Stores results in SQLite.
"""

import asyncio
import base64
import json
import os
import sqlite3
import subprocess
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
load_dotenv(override=True)

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

# ── Config ────────────────────────────────────────────────────────────────────
WORKFLOW_DIR    = os.environ.get("WORKFLOW_DIR", str(Path.home() / "CMA_CGM/mistral/evaluation_risques"))
WORKFLOW_NAME   = "tpra-evaluation"
DB_PATH         = "tickets.db"
UPLOAD_DIR      = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

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
            id           TEXT PRIMARY KEY,
            vendor       TEXT NOT NULL,
            project      TEXT,
            analyst      TEXT,
            source_type  TEXT NOT NULL,
            filename     TEXT,
            file_path    TEXT,
            status       TEXT DEFAULT 'pending',
            execution_id TEXT,
            result       TEXT,
            excel_path   TEXT,
            created_at   TEXT,
            updated_at   TEXT
        )
    """)
    conn.commit()
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
    created_at: str
    updated_at: str

class TicketDetail(TicketSummary):
    execution_id: Optional[str]
    result: Optional[dict]
    excel_path: Optional[str]

class ValidateRequest(BaseModel):
    approved: bool
    comments: Optional[str] = ""

# ── Background workflow runner ────────────────────────────────────────────────

async def _run_workflow(ticket_id: str, vendor: str, project: str,
                        analyst: str, source_type: str, content: str):
    """
    Runs the workflow via subprocess — exactly like `make execute`.
    Updates the DB with status + result when done.
    """
    input_data = json.dumps({
        "vendor":      vendor,
        "project":     project,
        "analyst":     analyst,
        "source_type": source_type,
        "content":     content,
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
        err = stderr.decode("utf-8", errors="ignore")

        print(f"📤 Workflow stdout: {output[:500]}")
        if err:
            print(f"⚠️  Workflow stderr: {err[:300]}")

        # Parse result — format is "Result: {...json...}"
        result_dict = None
        excel_path = None

        for line in output.splitlines():
            if line.startswith("Result:"):
                raw = line[len("Result:"):].strip()
                try:
                    # Le SDK retourne {'result': '{"status":...}'} 
                    # ou directement '{"status":...}'
                    outer = json.loads(raw.replace("'", '"'))
                    if isinstance(outer, dict) and "result" in outer:
                        inner = outer["result"]
                        result_dict = json.loads(inner) if isinstance(inner, str) else inner
                    else:
                        result_dict = outer
                    excel_path = result_dict.get("excel_path")
                except Exception:
                    # Fallback — try ast.literal_eval for Python dict format
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

    except Exception as e:
        print(f"❌ Workflow error: {e}")
        result_dict = {"error": str(e)}
        excel_path  = None
        status      = "error"

    now = datetime.utcnow().isoformat()
    conn = get_db()
    conn.execute("""
        UPDATE tickets
        SET status=?, result=?, excel_path=?, updated_at=?
        WHERE id=?
    """, (status, json.dumps(result_dict) if result_dict else None,
          excel_path, now, ticket_id))
    conn.commit()
    conn.close()
    print(f"✅ Ticket {ticket_id[:8]} → {status}")


async def _run_workflow_with_validation(ticket_id: str, vendor: str, project: str,
                                         analyst: str, source_type: str, content: str):
    """
    Runs workflow up to human validation, then waits for frontend signal.
    Uses a two-phase approach:
      Phase 1: run until waiting_validation, store partial result
      Phase 2: frontend sends /validate → continue
    Since the workflow handles validation internally via wait_for_input,
    we just run it fully and poll for completion.
    """
    # Mark as running
    _update_status(ticket_id, "running")

    # Run in background — workflow will pause internally for human validation
    # The workflow's wait_for_input is handled by Mistral Studio
    # Here we just run and wait for the full result
    await _run_workflow(ticket_id, vendor, project, analyst, source_type, content)


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

    # Launch workflow in background — non-blocking
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

    result = []
    for r in rows:
        res = None
        if r["result"]:
            try: res = json.loads(r["result"])
            except: pass
        result.append(TicketSummary(
            id=r["id"], vendor=r["vendor"], project=r["project"],
            analyst=r["analyst"], source_type=r["source_type"],
            filename=r["filename"], status=r["status"],
            global_score=res.get("global_score") if res else None,
            overall_score=res.get("overall_score") if res else None,
            final_decision=res.get("final_decision") if res else None,
            created_at=r["created_at"], updated_at=r["updated_at"],
        ))
    return result


@app.get("/tickets/{ticket_id}", response_model=TicketDetail)
async def get_ticket(ticket_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM tickets WHERE id=?", (ticket_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Ticket not found")

    result = None
    if row["result"]:
        try: result = json.loads(row["result"])
        except: pass

    res = result or {}
    return TicketDetail(
        id=row["id"], vendor=row["vendor"], project=row["project"],
        analyst=row["analyst"], source_type=row["source_type"],
        filename=row["filename"], status=row["status"],
        execution_id=row["execution_id"],
        global_score=res.get("global_score"),
        overall_score=res.get("overall_score"),
        final_decision=res.get("final_decision"),
        result=result, excel_path=row["excel_path"],
        created_at=row["created_at"], updated_at=row["updated_at"],
    )


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


@app.get("/health")
async def health():
    return {"status": "ok", "workflow_dir": WORKFLOW_DIR}