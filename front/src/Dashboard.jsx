import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:8000";

// ── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  pending:            { label: "Pending",            color: "#6B7280", bg: "#1F2937", dot: "#9CA3AF" },
  running:            { label: "Processing",         color: "#3B82F6", bg: "#1E3A5F", dot: "#60A5FA" },
  waiting_validation: { label: "Awaiting Review",    color: "#F59E0B", bg: "#3D2B0F", dot: "#FBBF24" },
  completed:          { label: "Completed",          color: "#10B981", bg: "#0B3320", dot: "#34D399" },
  rejected:           { label: "Rejected",           color: "#EF4444", bg: "#3B0F0F", dot: "#F87171" },
  error:              { label: "Error",              color: "#EF4444", bg: "#3B0F0F", dot: "#F87171" },
};

const RISK_COLORS = {
  Critical: "#EF4444",
  High:     "#F97316",
  Medium:   "#EAB308",
  Low:      "#22C55E",
};

const SCORE_COLORS = {
  1: "#EF4444",
  2: "#F97316",
  3: "#EAB308",
  4: "#22C55E",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: 20,
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
      border: `1px solid ${s.color}33`,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: s.dot,
        boxShadow: status === "running" ? `0 0 6px ${s.dot}` : "none",
        animation: status === "running" ? "pulse 1.5s infinite" : "none",
      }} />
      {s.label}
    </span>
  );
}

function ScoreBadge({ score }) {
  const color = SCORE_COLORS[score] || "#6B7280";
  const labels = { 1: "Non-compliant", 2: "Partial", 3: "Compliant", 4: "Mature" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 4,
      background: color + "22", color, fontSize: 11, fontWeight: 700,
      border: `1px solid ${color}44`,
    }}>
      {score}/4 — {labels[score]}
    </span>
  );
}

// ── Upload Modal ──────────────────────────────────────────────────────────────
function UploadModal({ onClose, onSuccess }) {
  const [vendor, setVendor]   = useState("");
  const [project, setProject] = useState("");
  const [analyst, setAnalyst] = useState("");
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [drag, setDrag]       = useState(false);

  async function submit() {
    if (!vendor || !file) { setError("Vendor name and file are required."); return; }
    setLoading(true); setError("");
    const fd = new FormData();
    fd.append("vendor", vendor);
    fd.append("project", project || "Not specified");
    fd.append("analyst", analyst || "Analyst");
    fd.append("file", file);
    try {
      const res = await fetch(`${API}/tickets`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const ticket = await res.json();
      onSuccess(ticket);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#00000088",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "#111827", border: "1px solid #1F2937",
        borderRadius: 16, padding: 32, width: 480,
        boxShadow: "0 25px 60px #000a",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ color: "#F9FAFB", fontSize: 18, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
            New TPRA Ticket
          </h2>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#6B7280",
            fontSize: 20, cursor: "pointer",
          }}>✕</button>
        </div>

        {[
          { label: "Vendor *", val: vendor, set: setVendor, ph: "Acme Corp" },
          { label: "Project", val: project, set: setProject, ph: "ERP Migration" },
          { label: "Analyst", val: analyst, set: setAnalyst, ph: "John Doe" },
        ].map(({ label, val, set, ph }) => (
          <div key={label} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#9CA3AF", fontSize: 12, marginBottom: 6, fontWeight: 600, letterSpacing: "0.05em" }}>
              {label}
            </label>
            <input
              value={val} onChange={e => set(e.target.value)}
              placeholder={ph}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8,
                background: "#1F2937", border: "1px solid #374151",
                color: "#F9FAFB", fontSize: 14, outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        ))}

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", color: "#9CA3AF", fontSize: 12, marginBottom: 6, fontWeight: 600, letterSpacing: "0.05em" }}>
            File * (.xlsx, .pdf, .txt)
          </label>
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); setFile(e.dataTransfer.files[0]); }}
            onClick={() => document.getElementById("file-input").click()}
            style={{
              border: `2px dashed ${drag ? "#3B82F6" : "#374151"}`,
              borderRadius: 8, padding: "20px 16px", textAlign: "center",
              cursor: "pointer", transition: "border-color 0.2s",
              background: drag ? "#1E3A5F22" : "#1F2937",
            }}
          >
            <input id="file-input" type="file" style={{ display: "none" }}
              accept=".xlsx,.xls,.pdf,.txt,.eml"
              onChange={e => setFile(e.target.files[0])}
            />
            {file ? (
              <span style={{ color: "#3B82F6", fontWeight: 600 }}>📎 {file.name}</span>
            ) : (
              <span style={{ color: "#6B7280", fontSize: 13 }}>
                Drop file here or click to browse
              </span>
            )}
          </div>
        </div>

        {error && (
          <div style={{
            background: "#3B0F0F", border: "1px solid #EF444444",
            borderRadius: 8, padding: "10px 14px", color: "#F87171",
            fontSize: 13, marginBottom: 16,
          }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "11px 0", borderRadius: 8,
            background: "#1F2937", border: "1px solid #374151",
            color: "#9CA3AF", cursor: "pointer", fontSize: 14, fontWeight: 600,
          }}>Cancel</button>
          <button onClick={submit} disabled={loading} style={{
            flex: 2, padding: "11px 0", borderRadius: 8,
            background: loading ? "#1E3A5F" : "#3B82F6",
            border: "none", color: "#fff", cursor: loading ? "wait" : "pointer",
            fontSize: 14, fontWeight: 700,
          }}>
            {loading ? "Launching workflow…" : "Launch Analysis"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Validate Modal ────────────────────────────────────────────────────────────
function ValidateModal({ ticket, onClose, onDone }) {
  const [comments, setComments] = useState("");
  const [loading, setLoading]   = useState(false);

  async function send(approved) {
    setLoading(true);
    await fetch(`${API}/tickets/${ticket.id}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved, comments }),
    });
    setLoading(false);
    onDone();
  }

  const result = ticket.result || {};

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#00000088",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "#111827", border: "1px solid #1F2937",
        borderRadius: 16, padding: 32, width: 560, maxHeight: "80vh",
        overflowY: "auto", boxShadow: "0 25px 60px #000a",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ color: "#F9FAFB", fontSize: 18, fontWeight: 700 }}>
            Review — {ticket.vendor}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6B7280", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        {/* Summary badges */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { label: "Decision", value: result.final_decision, color: result.final_decision === "Approved" ? "#10B981" : result.final_decision === "Rejected" ? "#EF4444" : "#F59E0B" },
            { label: "Risk Level", value: result.overall_score, color: RISK_COLORS[result.overall_score] || "#6B7280" },
            { label: "Global Score", value: result.global_score != null ? `${result.global_score}/4` : "—", color: "#3B82F6" },
            { label: "Showstoppers", value: result.showstopper_count ?? "—", color: result.showstopper_count > 0 ? "#EF4444" : "#10B981" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: "#1F2937", borderRadius: 8, padding: "8px 14px",
              border: `1px solid ${color}33`,
            }}>
              <div style={{ color: "#6B7280", fontSize: 10, letterSpacing: "0.1em", fontWeight: 700 }}>{label}</div>
              <div style={{ color, fontSize: 15, fontWeight: 700 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Executive summary */}
        {result.executive_summary && (
          <div style={{
            background: "#1F2937", borderRadius: 8, padding: 14,
            marginBottom: 16, border: "1px solid #374151",
          }}>
            <div style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 700, marginBottom: 6, letterSpacing: "0.08em" }}>EXECUTIVE SUMMARY</div>
            <p style={{ color: "#D1D5DB", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{result.executive_summary}</p>
          </div>
        )}

        {/* Showstoppers */}
        {result.showstoppers?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: "#EF4444", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: "0.08em" }}>🚨 SHOWSTOPPERS</div>
            {result.showstoppers.map((s, i) => (
              <div key={i} style={{
                background: "#3B0F0F", borderRadius: 6, padding: "8px 12px",
                marginBottom: 6, color: "#FCA5A5", fontSize: 12,
                border: "1px solid #EF444433",
              }}>❌ {s}</div>
            ))}
          </div>
        )}

        {/* Question scores preview */}
        {result.question_scores?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: "0.08em" }}>
              QUESTION SCORES ({result.question_scores.length})
            </div>
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {result.question_scores.map(q => (
                <div key={q.question_id} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "8px 0", borderBottom: "1px solid #1F2937",
                }}>
                  <span style={{
                    background: (SCORE_COLORS[q.score] || "#6B7280") + "22",
                    color: SCORE_COLORS[q.score] || "#6B7280",
                    fontSize: 10, fontWeight: 800, padding: "2px 6px",
                    borderRadius: 4, whiteSpace: "nowrap", flexShrink: 0,
                  }}>{q.question_id}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#D1D5DB", fontSize: 12, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {q.question?.slice(0, 60)}…
                    </div>
                    <ScoreBadge score={q.score} />
                    {q.is_showstopper && <span style={{ marginLeft: 6, color: "#EF4444", fontSize: 10, fontWeight: 700 }}>🚨</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", color: "#9CA3AF", fontSize: 12, marginBottom: 6, fontWeight: 600, letterSpacing: "0.05em" }}>
            Analyst Comments (optional)
          </label>
          <textarea
            value={comments} onChange={e => setComments(e.target.value)}
            rows={3} placeholder="Add your comments…"
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 8,
              background: "#1F2937", border: "1px solid #374151",
              color: "#F9FAFB", fontSize: 13, outline: "none",
              resize: "vertical", boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => send(false)} disabled={loading} style={{
            flex: 1, padding: "12px 0", borderRadius: 8,
            background: "#3B0F0F", border: "1px solid #EF444466",
            color: "#F87171", cursor: "pointer", fontSize: 14, fontWeight: 700,
          }}>❌ Reject</button>
          <button onClick={() => send(true)} disabled={loading} style={{
            flex: 2, padding: "12px 0", borderRadius: 8,
            background: "#0B3320", border: "1px solid #10B98166",
            color: "#34D399", cursor: "pointer", fontSize: 14, fontWeight: 700,
          }}>✅ Approve & Generate Excel</button>
        </div>
      </div>
    </div>
  );
}

// ── Ticket Row ────────────────────────────────────────────────────────────────
function TicketRow({ ticket, onSelect, onRefresh }) {
  async function download(e) {
    e.stopPropagation();
    window.open(`${API}/tickets/${ticket.id}/download`, "_blank");
  }

  return (
    <tr
      onClick={() => onSelect(ticket)}
      style={{
        cursor: "pointer",
        borderBottom: "1px solid #1F2937",
        transition: "background 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#1F2937"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <td style={{ padding: "14px 16px" }}>
        <div style={{ color: "#F9FAFB", fontWeight: 600, fontSize: 14 }}>{ticket.vendor}</div>
        <div style={{ color: "#6B7280", fontSize: 12 }}>{ticket.project || "—"}</div>
      </td>
      <td style={{ padding: "14px 16px", color: "#9CA3AF", fontSize: 12 }}>{ticket.analyst || "—"}</td>
      <td style={{ padding: "14px 16px" }}>
        <span style={{
          display: "inline-block", padding: "2px 8px", borderRadius: 4,
          background: "#1F2937", color: "#60A5FA", fontSize: 11, fontWeight: 600,
        }}>{ticket.source_type?.toUpperCase()}</span>
      </td>
      <td style={{ padding: "14px 16px" }}><StatusBadge status={ticket.status} /></td>
      <td style={{ padding: "14px 16px", color: "#6B7280", fontSize: 12 }}>{fmtDate(ticket.created_at)}</td>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {ticket.status === "completed" && (
            <button onClick={download} style={{
              padding: "5px 10px", borderRadius: 6,
              background: "#0B3320", border: "1px solid #10B98144",
              color: "#34D399", cursor: "pointer", fontSize: 11, fontWeight: 700,
            }}>⬇ Excel</button>
          )}
          {ticket.status === "waiting_validation" && (
            <button onClick={e => { e.stopPropagation(); onSelect(ticket); }} style={{
              padding: "5px 10px", borderRadius: 6,
              background: "#3D2B0F", border: "1px solid #F59E0B44",
              color: "#FBBF24", cursor: "pointer", fontSize: 11, fontWeight: 700,
            }}>👁 Review</button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [tickets, setTickets]         = useState([]);
  const [filter, setFilter]           = useState("all");
  const [showUpload, setShowUpload]   = useState(false);
  const [selected, setSelected]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const fetchTickets = useCallback(async () => {
    try {
      const url = filter === "all" ? `${API}/tickets` : `${API}/tickets?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets, lastRefresh]);

  // Auto-refresh every 10s if any ticket is running
  useEffect(() => {
    const hasActive = tickets.some(t => ["running", "waiting_validation"].includes(t.status));
    if (!hasActive) return;
    const id = setInterval(() => setLastRefresh(Date.now()), 10000);
    return () => clearInterval(id);
  }, [tickets]);

  const counts = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const FILTERS = [
    { key: "all",                label: "All",              count: tickets.length },
    { key: "pending",            label: "Pending",          count: counts.pending || 0 },
    { key: "running",            label: "Processing",       count: counts.running || 0 },
    { key: "waiting_validation", label: "Awaiting Review",  count: counts.waiting_validation || 0 },
    { key: "completed",          label: "Completed",        count: counts.completed || 0 },
    { key: "rejected",           label: "Rejected",         count: counts.rejected || 0 },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0B0F17",
      color: "#F9FAFB",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0B0F17; }
        ::-webkit-scrollbar-thumb { background: #374151; border-radius: 2px; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        tbody tr { animation: fadeIn 0.2s ease; }
      `}</style>

      {/* Header */}
      <header style={{
        borderBottom: "1px solid #1F2937",
        padding: "0 32px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#0D1117",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>🛡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em" }}>TPRA Platform</div>
            <div style={{ color: "#6B7280", fontSize: 11 }}>Third Party Risk Assessment</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setLastRefresh(Date.now())} style={{
            padding: "7px 14px", borderRadius: 8,
            background: "#1F2937", border: "1px solid #374151",
            color: "#9CA3AF", cursor: "pointer", fontSize: 12, fontWeight: 600,
          }}>↻ Refresh</button>
          <button onClick={() => setShowUpload(true)} style={{
            padding: "7px 18px", borderRadius: 8,
            background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
            border: "none", color: "#fff", cursor: "pointer",
            fontSize: 13, fontWeight: 700,
          }}>+ New Ticket</button>
        </div>
      </header>

      <div style={{ padding: "28px 32px" }}>

        {/* Stats */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Total Tickets",    value: tickets.length,               color: "#3B82F6" },
            { label: "Processing",       value: counts.running || 0,          color: "#60A5FA" },
            { label: "Awaiting Review",  value: counts.waiting_validation || 0, color: "#FBBF24" },
            { label: "Completed",        value: counts.completed || 0,        color: "#34D399" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              flex: 1, background: "#111827",
              border: `1px solid ${color}22`,
              borderRadius: 12, padding: "16px 20px",
            }}>
              <div style={{ color: "#6B7280", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
              <div style={{ color, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
          {FILTERS.map(({ key, label, count }) => (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding: "6px 14px", borderRadius: 8, cursor: "pointer",
              fontSize: 12, fontWeight: 600,
              background: filter === key ? "#1F2937" : "transparent",
              border: filter === key ? "1px solid #374151" : "1px solid transparent",
              color: filter === key ? "#F9FAFB" : "#6B7280",
              transition: "all 0.15s",
            }}>
              {label} {count > 0 && (
                <span style={{
                  marginLeft: 4, padding: "1px 6px", borderRadius: 10,
                  background: filter === key ? "#374151" : "#1F2937",
                  fontSize: 10,
                }}>{count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{
          background: "#111827", borderRadius: 12,
          border: "1px solid #1F2937", overflow: "hidden",
        }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: "center", color: "#6B7280" }}>
              Loading tickets…
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ padding: 64, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ color: "#6B7280", fontSize: 14 }}>No tickets yet</div>
              <button onClick={() => setShowUpload(true)} style={{
                marginTop: 16, padding: "8px 20px", borderRadius: 8,
                background: "#3B82F6", border: "none",
                color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600,
              }}>Create your first ticket</button>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0D1117", borderBottom: "1px solid #1F2937" }}>
                  {["Vendor / Project", "Analyst", "Type", "Status", "Created", "Actions"].map(h => (
                    <th key={h} style={{
                      padding: "12px 16px", textAlign: "left",
                      color: "#6B7280", fontSize: 11, fontWeight: 700,
                      letterSpacing: "0.08em",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <TicketRow
                    key={t.id} ticket={t}
                    onSelect={setSelected}
                    onRefresh={() => setLastRefresh(Date.now())}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={ticket => {
            setShowUpload(false);
            setLastRefresh(Date.now());
          }}
        />
      )}

      {selected && (
        <ValidateModal
          ticket={selected}
          onClose={() => setSelected(null)}
          onDone={() => { setSelected(null); setLastRefresh(Date.now()); }}
        />
      )}
    </div>
  );
}