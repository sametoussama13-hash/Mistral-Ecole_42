# evaluation_risques

A [Mistral Workflows](https://docs.mistral.ai/workflows/getting-started/introduction) project — Third Party Risk Assessment (TPRA) platform powered by AI.

---

## Project Team

| Role | Responsibilities |
|---|---|
| **Frontend Developer** | Design and development of the React dashboard — ticket management interface, file upload, validation modals, real-time status display |
| **Backend Developer** | FastAPI API development — ticket lifecycle management, workflow orchestration, SQLite storage, Excel report download |
| **Testing & Training** | Functional testing of workflows, validation of scoring and risk analysis outputs, dataset preparation and AI prompt refinement |
| **Coordination & Reporting** | Project coordination, stakeholder communication, README and technical documentation, progress reporting |

---

## Setup

```bash
uv sync
```

---

## Commands

### Register workflows in AI Studio

Auto-discovers all workflow classes in `src/workflows/`, registers them with AI Studio, and starts polling for executions. The [deployment name](https://docs.mistral.ai/workflows/managing-workflows-in-production/deployments) is set to your hostname:

```bash
make start-worker
```

### Execute a workflow

In a separate terminal, trigger a workflow execution by name:

```bash
make execute workflow=hello-world input='{"name": "World"}'
```

---

## Architecture

```
Frontend (React)          Backend (FastAPI)          Mistral Workflows
     ↓                         ↓                           ↓
Upload Excel file  →  POST /tickets  →  make execute  →  extract_text
View ticket status ←  GET /tickets   ←  result JSON   ←  analyze_risks
Approve / Reject   →  POST /validate →  signal        ←  score_responses
Download Excel     ←  GET /download  ←  .xlsx file    ←  export_excel
```

---

## Running the Platform

Three terminals are required simultaneously:

**Terminal 1 — Mistral Worker**
```bash
cd evaluation_risques
make start-worker
```

**Terminal 2 — FastAPI Backend**
```bash
cd Back
uvicorn main:app --reload --port 8000 --host 0.0.0.0
```

**Terminal 3 — React Frontend**
```bash
cd front
npm start
```

---

## Examples

The `src/examples/` directory contains complete workflow cookbooks that demonstrate advanced patterns. They are **not** loaded by the default `make start-worker`.

| Example | Description |
|---|---|
| [Insurance Claims Triage](src/examples/insurance_claims/) | Parallel vision analysis, retry policies, deterministic branching, structured LLM output |
| [Cargo Release Compliance](src/examples/cargo_release/) | HITL `wait_for_input()`, child sub-workflows, retry policies, structured LLM output |
| [Code Modernization](src/examples/code_modernization/) | Sub-workflow fan-out, sandboxed validation, retry-loop, HITL approval |

### Start the examples worker

```bash
make start-examples
```

Then trigger an execution in a separate terminal:

```bash
make execute-insurance-claims input='{"claim_id":"CLM-001","claimant_name":"Jane","description":"My car was hit.","photos":["src/examples/insurance_claims/sample_data/photos/claim_low_scratch_door.jpg"]}'
```

---

## Project Layout

```
src/
├── entrypoints/     # Runnable modules, invoked via `python -m entrypoints.<module>`
│   ├── worker.py    # `python -m entrypoints.worker` — discover and run workflows
│   ├── start.py     # `python -m entrypoints.start`  — trigger a workflow execution
│   └── dev.py       # `python -m entrypoints.dev`    — worker with file-watch auto-reload
├── workflows/       # Workflow classes (auto-discovered by `entrypoints.worker`)
│   ├── router.py    # Workflow entry point — orchestrates the full TPRA pipeline
│   ├── analyzer.py  # Risk identification from vendor responses
│   ├── scorer.py    # Question scoring (scale 1–4) and risk level recalculation
│   ├── extractor.py # Text extraction from Excel, PDF and email inputs
│   ├── reporter.py  # Text report generation and Excel export
│   └── utils.py     # Shared helpers — question parsing, score-to-level conversion
└── examples/        # Example workflow cookbooks (opt-in via `examples.worker`)

Back/
├── main.py          # FastAPI backend — ticket management and workflow orchestration
├── tickets.db       # SQLite database
└── uploads/         # Uploaded vendor questionnaire files

front/
└── src/
    └── Dashboard.jsx  # React dashboard — ticket list, upload modal, review modal
```

---

## Development

```bash
# Format
uv run ruff format .

# Lint
uv run ruff check --fix .
```