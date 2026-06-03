import { useState, useEffect, useCallback, useRef } from "react";

const API = "http://localhost:8000";

const WORKFLOW_STEPS = [
  { key: "extract_text",         label: "extract_text" },
  { key: "analyze_risks",        label: "analyze_risks" },
  { key: "score_responses",      label: "score_responses" },
  { key: "generate_text_report", label: "generate_text_report" },
  { key: "export_excel",         label: "export_excel" },
];

const STATUS = {
  pending:             { label: "En attente",  color: "#6B7280", bg: "#F3F4F6", dot: "#9CA3AF" },
  running:             { label: "En cours",    color: "#2563EB", bg: "#EFF6FF", dot: "#3B82F6" },
  waiting_validation:  { label: "À valider",   color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" },
  completed:           { label: "Terminé",     color: "#059669", bg: "#ECFDF5", dot: "#10B981" },
  rejected:            { label: "Rejeté",      color: "#DC2626", bg: "#FEF2F2", dot: "#EF4444" },
  error:               { label: "Erreur",      color: "#DC2626", bg: "#FEF2F2", dot: "#EF4444" },
};

const RISK_COLORS  = { Critical: "#DC2626", High: "#EA580C", Medium: "#D97706", Low: "#16A34A" };
const SCORE_COLORS = { 1: "#DC2626", 2: "#EA580C", 3: "#D97706", 4: "#16A34A" };
const SCORE_BG     = { 1: "#FEF2F2", 2: "#FFF7ED", 3: "#FFFBEB", 4: "#F0FDF4" };
const SCORE_LABELS = { 1: "Non-conforme", 2: "Partiel", 3: "Conforme", 4: "Mature" };

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function fmtDuration(ms) {
  if (ms == null) return null;
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.floor(ms / 60000)} min ${Math.round((ms % 60000) / 1000)} s`;
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, border: `1px solid ${s.color}22` }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0, animation: status === "running" ? "blink 1.4s infinite" : "none" }} />
      {s.label}
    </span>
  );
}

function ScorePill({ score }) {
  if (!score) return null;
  return (
    <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 4, background: SCORE_BG[score], color: SCORE_COLORS[score], fontSize: 11, fontWeight: 600, border: `1px solid ${SCORE_COLORS[score]}33` }}>
      {score}/4 · {SCORE_LABELS[score]}
    </span>
  );
}

function WorkflowTimeline({ ticket }) {
  const steps = ticket.workflow_steps || deriveSteps(ticket.status);
  function deriveSteps(status) {
    const order = ["extract_text","analyze_risks","score_responses","generate_text_report","export_excel"];
    const doneCount = { running:1, waiting_validation:3, completed:5, rejected:3, error:1 }[status] ?? 0;
    return order.map((key,i) => ({
      key,
      status: i < doneCount ? "done" : i === doneCount && ["running","error"].includes(status) ? (status === "error" ? "error" : "running") : "pending",
      duration_ms: null,
    }));
  }
  return (
    <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 16px", marginBottom: 20, overflowX: "auto" }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.08em", marginBottom: 12 }}>PROGRESSION DU WORKFLOW</div>
      <div style={{ display: "flex", alignItems: "center", minWidth: "max-content" }}>
        {steps.map((step, i) => {
          const isDone=step.status==="done", isRun=step.status==="running", isErr=step.status==="error";
          const color  = isDone?"#059669":isRun?"#2563EB":isErr?"#DC2626":"#D1D5DB";
          const bgC    = isDone?"#ECFDF5":isRun?"#EFF6FF":isErr?"#FEF2F2":"#F3F4F6";
          const bdr    = isDone?"#A7F3D0":isRun?"#BFDBFE":isErr?"#FECACA":"#E5E7EB";
          return (
            <div key={step.key} style={{ display:"flex", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px", borderRadius:6, background:bgC, border:`1px solid ${bdr}`, color, minWidth:115 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:color, flexShrink:0, animation:isRun?"blink 1.4s infinite":"none" }} />
                <div>
                  <div style={{ fontSize:10, fontWeight:700, whiteSpace:"nowrap", fontFamily:"monospace" }}>{step.key}</div>
                  {step.duration_ms!=null && <div style={{ fontSize:9, color:"#9CA3AF", marginTop:1 }}>{fmtDuration(step.duration_ms)}</div>}
                  {isRun && <div style={{ fontSize:9, color:"#2563EB", marginTop:1 }}>en cours…</div>}
                </div>
                {isDone && <span style={{ marginLeft:"auto", color:"#059669", fontSize:11, flexShrink:0 }}>✓</span>}
                {isErr  && <span style={{ marginLeft:"auto", color:"#DC2626", fontSize:11, flexShrink:0 }}>✗</span>}
              </div>
              {i < steps.length-1 && (
                <div style={{ width:20, height:1, background:isDone?"#A7F3D0":"#E5E7EB", flexShrink:0, position:"relative" }}>
                  <span style={{ position:"absolute", right:-4, top:-5, color:isDone?"#10B98188":"#D1D5DB", fontSize:10 }}>›</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuestionList({ questions }) {
  const [search, setSearch]           = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [expanded, setExpanded]       = useState(null);
  const filtered = questions.filter(q => {
    const ok1 = !search || q.question?.toLowerCase().includes(search.toLowerCase()) || q.question_id?.toLowerCase().includes(search.toLowerCase());
    const ok2 = scoreFilter==="all" || String(q.score)===scoreFilter;
    return ok1 && ok2;
  });
  const counts = questions.reduce((acc,q) => { acc[q.score]=(acc[q.score]||0)+1; return acc; }, {});
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <span style={{ fontSize:10, fontWeight:600, color:"#9CA3AF", letterSpacing:"0.08em" }}>QUESTIONS TRAITÉES ({questions.length})</span>
        <div style={{ display:"flex", gap:4 }}>
          {["all","1","2","3","4"].map(s => {
            const active=scoreFilter===s;
            const col=s==="all"?"#374151":SCORE_COLORS[+s];
            return (
              <button key={s} onClick={() => setScoreFilter(active&&s!=="all"?"all":s)}
                style={{ padding:"2px 7px", borderRadius:10, fontSize:10, fontWeight:600, cursor:"pointer", background:active?(s==="all"?"#F3F4F6":SCORE_BG[+s]):"transparent", border:active?`1px solid ${col}33`:"1px solid transparent", color:active?col:"#9CA3AF" }}>
                {s==="all"?"Tous":`${s}/4`}{s!=="all"&&counts[+s]?` (${counts[+s]})`:""}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ position:"relative", marginBottom:8 }}>
        <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:"#9CA3AF", fontSize:14, pointerEvents:"none" }}>⌕</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une question…"
          style={{ width:"100%", padding:"7px 10px 7px 26px", borderRadius:6, background:"#F9FAFB", border:"1px solid #E5E7EB", color:"#111827", fontSize:12, outline:"none", boxSizing:"border-box" }} />
      </div>
      <div style={{ border:"1px solid #E5E7EB", borderRadius:8, overflow:"hidden" }}>
        {filtered.length===0
          ? <div style={{ padding:20, textAlign:"center", color:"#9CA3AF", fontSize:12 }}>Aucune question correspondante</div>
          : filtered.map((q,idx) => {
              const col=SCORE_COLORS[q.score]||"#9CA3AF";
              const isEx=expanded===q.question_id;
              return (
                <div key={q.question_id} onClick={() => setExpanded(isEx?null:q.question_id)}
                  style={{ borderBottom:idx<filtered.length-1?"1px solid #F3F4F6":"none", cursor:"pointer", background:isEx?"#FAFAFA":"#fff" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"9px 12px" }}>
                    <div style={{ width:3, height:34, borderRadius:2, background:col, flexShrink:0, marginTop:2 }} />
                    <span style={{ background:SCORE_BG[q.score]||"#F3F4F6", color:col, fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4, whiteSpace:"nowrap", flexShrink:0, fontFamily:"monospace", border:`1px solid ${col}22`, marginTop:1 }}>{q.question_id}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ color:"#111827", fontSize:12, lineHeight:1.5, overflow:isEx?"visible":"hidden", textOverflow:"ellipsis", whiteSpace:isEx?"normal":"nowrap" }}>{q.question}</div>
                      {isEx&&q.justification&&<div style={{ color:"#6B7280", fontSize:11, marginTop:6, lineHeight:1.6, borderLeft:`2px solid ${col}44`, paddingLeft:8 }}>{q.justification}</div>}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0, marginTop:1 }}>
                      <ScorePill score={q.score} />
                      {q.is_showstopper&&<span style={{ color:"#DC2626", fontSize:11 }}>⊘</span>}
                      <span style={{ color:"#9CA3AF", fontSize:10, transform:isEx?"rotate(180deg)":"none", display:"inline-block", transition:"transform 0.2s" }}>▾</span>
                    </div>
                  </div>
                </div>
              );
            })
        }
      </div>
      {questions.length>0&&(
        <div style={{ marginTop:8, display:"flex", gap:12, flexWrap:"wrap" }}>
          {[4,3,2,1].filter(s=>counts[s]).map(s=>(
            <div key={s} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:SCORE_COLORS[s] }} />
              <span style={{ color:"#6B7280", fontSize:11 }}>{counts[s]} {SCORE_LABELS[s]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Live Tracking Modal ───────────────────────────────────────────────────────
// Phases:
//   "tracking"   — ticket is running, we poll every 3s and show live timeline
//   "validate"   — ticket reached waiting_validation → show results + Approve/Reject
//   "done"       — completed (auto-approved) or rejected → show summary, close button
function LiveTrackingModal({ ticketId, onClose, onRefreshList }) {
  const [ticket, setTicket]   = useState(null);
  const [phase, setPhase]     = useState("tracking");
  const [comments, setComments] = useState("");
  const [sending, setSending]   = useState(false);
  const [tab, setTab]           = useState("overview");
  const intervalRef             = useRef(null);

  const fetchTicket = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/tickets/${ticketId}`);
      const data = await res.json();
      setTicket(data);
      if (data.status === "waiting_validation") {
        setPhase("validate");
        clearInterval(intervalRef.current);
      } else if (data.status === "completed" && data.result?.final_decision === "Rejected") {
        setPhase("validate");
        clearInterval(intervalRef.current);
      } else if (data.status === "completed" || data.status === "rejected" || data.status === "error") {
        setPhase("done");
        clearInterval(intervalRef.current);
        onRefreshList();
      }
    } catch (e) { console.error(e); }
  }, [ticketId, onRefreshList]);

  useEffect(() => {
    fetchTicket();
    intervalRef.current = setInterval(fetchTicket, 3000);
    return () => clearInterval(intervalRef.current);
  }, [fetchTicket]);

  async function sendValidation(approved) {
    setSending(true);
    await fetch(`${API}/tickets/${ticket.id}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved, comments }),
    });
    setSending(false);
    onRefreshList();
    onClose();
  }

  const result      = ticket?.result || {};
  const hasQuestions = result.question_scores?.length > 0;

  const needsValidation = ticket?.result?.needs_validation !== false;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.2)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:32, width:720, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.1)", border:"1px solid #E5E7EB" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:600, color:"#111827" }}>
              {ticket ? ticket.vendor : "Chargement…"}
            </div>
            {ticket && (
              <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:4 }}>
                {ticket.project && <span style={{ color:"#9CA3AF", fontSize:12 }}>{ticket.project}</span>}
                {ticket.analyst && <span style={{ color:"#9CA3AF", fontSize:12 }}>· {ticket.analyst}</span>}
                <StatusBadge status={ticket.status} />
              </div>
            )}
          </div>
          {phase !== "tracking" && (
            <button onClick={onClose} style={{ background:"none", border:"none", color:"#9CA3AF", fontSize:18, cursor:"pointer", flexShrink:0 }}>✕</button>
          )}
        </div>

        {/* ── Phase: TRACKING ── */}
        {phase === "tracking" && ticket && (
          <>
            <WorkflowTimeline ticket={ticket} />
            <div style={{ textAlign:"center", padding:"32px 0 16px" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:10, color:"#2563EB", fontSize:13, fontWeight:500 }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:"#3B82F6", display:"inline-block", animation:"blink 1.4s infinite" }} />
                Traitement en cours, veuillez patienter…
              </div>
              <div style={{ color:"#9CA3AF", fontSize:12, marginTop:8 }}>Cette fenêtre se met à jour automatiquement toutes les 3 secondes.</div>
            </div>
          </>
        )}

        {phase === "tracking" && !ticket && (
          <div style={{ padding:"48px 0", textAlign:"center", color:"#9CA3AF", fontSize:13 }}>Connexion au serveur…</div>
        )}

        {/* ── Phase: VALIDATE ── */}
        {phase === "validate" && ticket && (
          <>
            <WorkflowTimeline ticket={ticket} />

            {hasQuestions && (
              <div style={{ display:"flex", gap:0, borderBottom:"1px solid #E5E7EB", marginBottom:20 }}>
                {[{ key:"overview", label:"Résumé" }, { key:"questions", label:`Questions (${result.question_scores.length})` }].map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    style={{ padding:"9px 18px", background:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:tab===t.key?600:400, color:tab===t.key?"#2563EB":"#6B7280", borderBottom:tab===t.key?"2px solid #2563EB":"2px solid transparent", transition:"all 0.12s" }}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {tab === "overview" && (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
                  {[
                    { label:"Décision",      value:result.final_decision||"—",               color:result.final_decision==="Approved"?"#059669":result.final_decision==="Rejected"?"#DC2626":"#D97706" },
                    { label:"Niveau risque", value:result.overall_score||"—",                 color:RISK_COLORS[result.overall_score]||"#6B7280" },
                    { label:"Score global",  value:result.global_score!=null?`${result.global_score}/4`:"—", color:"#2563EB" },
                    { label:"Showstoppers",  value:result.showstopper_count??"—",             color:result.showstopper_count>0?"#DC2626":"#059669" },
                  ].map(({ label,value,color }) => (
                    <div key={label} style={{ background:"#F9FAFB", borderRadius:8, padding:"10px 14px", border:"1px solid #E5E7EB" }}>
                      <div style={{ color:"#9CA3AF", fontSize:10, fontWeight:600, letterSpacing:"0.07em", marginBottom:4 }}>{label.toUpperCase()}</div>
                      <div style={{ color, fontSize:16, fontWeight:600 }}>{value}</div>
                    </div>
                  ))}
                </div>
                {result.executive_summary && (
                  <div style={{ background:"#F9FAFB", borderRadius:8, padding:"12px 14px", marginBottom:14, border:"1px solid #E5E7EB" }}>
                    <div style={{ color:"#9CA3AF", fontSize:10, fontWeight:600, letterSpacing:"0.07em", marginBottom:6 }}>RÉSUMÉ EXÉCUTIF</div>
                    <p style={{ color:"#374151", fontSize:13, lineHeight:1.7, margin:0 }}>{result.executive_summary}</p>
                  </div>
                )}
                {result.showstoppers?.length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    <div style={{ color:"#DC2626", fontSize:10, fontWeight:600, letterSpacing:"0.07em", marginBottom:6 }}>SHOWSTOPPERS</div>
                    {result.showstoppers.map((s,i) => (
                      <div key={i} style={{ background:"#FEF2F2", borderRadius:6, padding:"8px 12px", marginBottom:5, color:"#991B1B", fontSize:12, border:"1px solid #FECACA" }}>⊘ {s}</div>
                    ))}
                  </div>
                )}
                {hasQuestions && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                      <span style={{ color:"#9CA3AF", fontSize:10, fontWeight:600, letterSpacing:"0.07em" }}>APERÇU DES QUESTIONS</span>
                      <button onClick={() => setTab("questions")} style={{ background:"none", border:"none", color:"#2563EB", fontSize:11, cursor:"pointer", fontWeight:500 }}>
                        Voir toutes ({result.question_scores.length}) →
                      </button>
                    </div>
                    {result.question_scores.slice(0,4).map(q => (
                      <div key={q.question_id} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom:"1px solid #F3F4F6" }}>
                        <span style={{ background:SCORE_BG[q.score]||"#F3F4F6", color:SCORE_COLORS[q.score]||"#9CA3AF", fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4, whiteSpace:"nowrap", flexShrink:0, fontFamily:"monospace", border:`1px solid ${(SCORE_COLORS[q.score]||"#9CA3AF")}22` }}>{q.question_id}</span>
                        <div style={{ flex:1, minWidth:0, color:"#374151", fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{q.question}</div>
                        <ScorePill score={q.score} />
                        {q.is_showstopper&&<span style={{ color:"#DC2626", fontSize:11 }}>⊘</span>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === "questions" && hasQuestions && <QuestionList questions={result.question_scores} />}

            {/* Separator */}
            <div style={{ borderTop:"1px solid #E5E7EB", marginTop:4, paddingTop:20 }}>
              {result.final_decision === "Rejected" ? (
                <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:14 }}>🚫</span>
                  <span style={{ color:"#991B1B", fontSize:12, fontWeight:500 }}>
                    L'analyse recommande le <strong>rejet</strong> de ce fournisseur ({result.showstopper_count ?? 0} showstopper{result.showstopper_count > 1 ? "s" : ""}). Confirmez ou substituez la décision.
                  </span>
                </div>
              ) : (
                <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:8, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:14 }}>⚠️</span>
                  <span style={{ color:"#92400E", fontSize:12, fontWeight:500 }}>Ce ticket nécessite une validation manuelle avant d'être finalisé.</span>
                </div>
              )}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#374151", marginBottom:5 }}>Commentaires (optionnel)</label>
                <textarea value={comments} onChange={e => setComments(e.target.value)} rows={3} placeholder="Ajoutez vos commentaires…"
                  style={{ width:"100%", padding:"9px 12px", borderRadius:8, background:"#F9FAFB", border:"1px solid #E5E7EB", color:"#111827", fontSize:13, outline:"none", resize:"vertical", boxSizing:"border-box" }} />
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => sendValidation(false)} disabled={sending}
                  style={{ flex:1, padding:"11px 0", borderRadius:8, background:"#FEF2F2", border:"1px solid #FECACA", color:"#DC2626", cursor:"pointer", fontSize:13, fontWeight:600 }}>
                  Confirmer le rejet
                </button>
                <button onClick={() => sendValidation(true)} disabled={sending}
                  style={{ flex:2, padding:"11px 0", borderRadius:8, background:"#2563EB", border:"none", color:"#fff", cursor:sending?"wait":"pointer", fontSize:13, fontWeight:600 }}>
                  {sending ? "Envoi…" : result.final_decision === "Rejected" ? "Passer outre & Approuver" : "Approuver & Générer Excel"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Phase: DONE (auto-completed or rejected) ── */}
        {phase === "done" && ticket && (() => {
          const finalDecision = ticket.result?.final_decision;
          const isApproved    = ticket.status === "completed" && finalDecision !== "Rejected";
          const isRejected    = ticket.status === "completed" && finalDecision === "Rejected";
          const isError       = ticket.status === "error";
          return (
            <>
              <WorkflowTimeline ticket={ticket} />
              <div style={{ textAlign:"center", padding:"24px 0 28px" }}>
                {isApproved && (
                  <>
                    <div style={{ fontSize:36, marginBottom:10 }}>✅</div>
                    <div style={{ fontSize:15, fontWeight:600, color:"#059669", marginBottom:4 }}>Analyse terminée — Approuvé</div>
                    <div style={{ color:"#9CA3AF", fontSize:12 }}>Le ticket a été validé automatiquement et ajouté à la liste.</div>
                    <button onClick={() => window.open(`${API}/tickets/${ticket.id}/download`, "_blank")}
                      style={{ marginTop:20, padding:"9px 24px", borderRadius:8, background:"#ECFDF5", border:"1px solid #A7F3D0", color:"#059669", cursor:"pointer", fontSize:13, fontWeight:600 }}>
                      ⬇ Télécharger Excel
                    </button>
                  </>
                )}
                {isRejected && (
                  <>
                    <div style={{ fontSize:36, marginBottom:10 }}>🚫</div>
                    <div style={{ fontSize:15, fontWeight:600, color:"#DC2626", marginBottom:4 }}>Analyse terminée — Rejeté</div>
                    <div style={{ color:"#9CA3AF", fontSize:12, marginBottom:16 }}>
                      La décision finale est <strong style={{ color:"#DC2626" }}>Rejected</strong> en raison de risques critiques détectés.
                    </div>
                    {ticket.result?.showstoppers?.length > 0 && (
                      <div style={{ textAlign:"left", maxWidth:420, margin:"0 auto 16px", background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"10px 14px" }}>
                        <div style={{ color:"#DC2626", fontSize:10, fontWeight:700, letterSpacing:"0.07em", marginBottom:6 }}>SHOWSTOPPERS</div>
                        {ticket.result.showstoppers.map((s, i) => (
                          <div key={i} style={{ color:"#991B1B", fontSize:12, marginBottom:4 }}>⊘ {s}</div>
                        ))}
                      </div>
                    )}
                    <button onClick={() => window.open(`${API}/tickets/${ticket.id}/download`, "_blank")}
                      style={{ marginTop:4, padding:"9px 24px", borderRadius:8, background:"#FEF2F2", border:"1px solid #FECACA", color:"#DC2626", cursor:"pointer", fontSize:13, fontWeight:600 }}>
                      ⬇ Télécharger le rapport Excel
                    </button>
                  </>
                )}
                {isError && (
                  <>
                    <div style={{ fontSize:36, marginBottom:10 }}>❌</div>
                    <div style={{ fontSize:15, fontWeight:600, color:"#DC2626", marginBottom:4 }}>Une erreur s'est produite</div>
                    <div style={{ color:"#9CA3AF", fontSize:12 }}>Le workflow a rencontré une erreur. Vérifiez les logs.</div>
                  </>
                )}
              </div>
              <div style={{ display:"flex", justifyContent:"center" }}>
                <button onClick={onClose} style={{ padding:"9px 28px", borderRadius:8, background:"#F3F4F6", border:"none", color:"#6B7280", cursor:"pointer", fontSize:13, fontWeight:500 }}>Fermer</button>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

// ── Upload Modal ──────────────────────────────────────────────────────────────
function UploadModal({ onClose, onLaunched }) {
  const [vendor, setVendor]   = useState("");
  const [project, setProject] = useState("");
  const [analyst, setAnalyst] = useState("");
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [drag, setDrag]       = useState(false);

  async function submit() {
    if (!vendor || !file) { setError("Le fournisseur et le fichier sont requis."); return; }
    setLoading(true); setError("");
    const fd = new FormData();
    fd.append("vendor", vendor); fd.append("project", project||"Non spécifié");
    fd.append("analyst", analyst||"Analyste"); fd.append("file", file);
    try {
      const res = await fetch(`${API}/tickets`, { method:"POST", body:fd });
      if (!res.ok) throw new Error(await res.text());
      const ticket = await res.json();
      onLaunched(ticket.id);
    } catch (e) { setError(e.message); setLoading(false); }
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.25)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:32, width:460, boxShadow:"0 20px 60px rgba(0,0,0,0.1)", border:"1px solid #E5E7EB" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:600, color:"#111827" }}>Nouveau ticket TPRA</div>
            <div style={{ fontSize:12, color:"#9CA3AF", marginTop:2 }}>Lancer une analyse de risque fournisseur</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#9CA3AF", fontSize:18, cursor:"pointer" }}>✕</button>
        </div>
        {[
          { label:"Fournisseur *", val:vendor,  set:setVendor,  ph:"Acme Corp" },
          { label:"Projet",        val:project, set:setProject, ph:"Migration ERP" },
          { label:"Analyste",      val:analyst, set:setAnalyst, ph:"Jean Dupont" },
        ].map(({ label,val,set,ph }) => (
          <div key={label} style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#374151", marginBottom:5 }}>{label}</label>
            <input value={val} onChange={e => set(e.target.value)} placeholder={ph}
              style={{ width:"100%", padding:"9px 12px", borderRadius:8, background:"#F9FAFB", border:"1px solid #E5E7EB", color:"#111827", fontSize:13, outline:"none", boxSizing:"border-box" }} />
          </div>
        ))}
        <div style={{ marginBottom:18 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#374151", marginBottom:5 }}>Fichier * (.xlsx, .pdf, .txt)</label>
          <div onClick={() => document.getElementById("fu-input").click()}
            onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); setFile(e.dataTransfer.files[0]); }}
            style={{ border:`1.5px dashed ${drag?"#2563EB":"#D1D5DB"}`, borderRadius:8, padding:"18px 14px", textAlign:"center", cursor:"pointer", background:drag?"#EFF6FF":"#F9FAFB", transition:"all 0.15s" }}>
            <input id="fu-input" type="file" style={{ display:"none" }} accept=".xlsx,.xls,.pdf,.txt,.eml" onChange={e => setFile(e.target.files[0])} />
            {file
              ? <span style={{ color:"#2563EB", fontSize:13, fontWeight:500 }}>📎 {file.name}</span>
              : <span style={{ color:"#9CA3AF", fontSize:12 }}>Glissez un fichier ou cliquez pour parcourir</span>}
          </div>
        </div>
        {error && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:7, padding:"9px 12px", color:"#DC2626", fontSize:12, marginBottom:14 }}>{error}</div>}
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:"10px 0", borderRadius:8, background:"#F3F4F6", border:"none", color:"#6B7280", cursor:"pointer", fontSize:13, fontWeight:500 }}>Annuler</button>
          <button onClick={submit} disabled={loading} style={{ flex:2, padding:"10px 0", borderRadius:8, background:loading?"#93C5FD":"#2563EB", border:"none", color:"#fff", cursor:loading?"wait":"pointer", fontSize:13, fontWeight:600 }}>
            {loading ? "Lancement…" : "Lancer l'analyse"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal (lecture seule pour tickets existants) ───────────────────────
function DetailModal({ ticket, onClose, onDone }) {
  const [comments, setComments] = useState("");
  const [loading, setLoading]   = useState(false);
  const [tab, setTab]           = useState("overview");
  const result       = ticket.result || {};
  const isValidation = ticket.status === "waiting_validation";
  const hasQuestions = result.question_scores?.length > 0;

  async function send(approved) {
    setLoading(true);
    await fetch(`${API}/tickets/${ticket.id}/validate`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ approved, comments }) });
    setLoading(false); onDone();
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.2)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:32, width:720, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.1)", border:"1px solid #E5E7EB" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:600, color:"#111827" }}>{ticket.vendor}</div>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:4 }}>
              {ticket.project&&<span style={{ color:"#9CA3AF", fontSize:12 }}>{ticket.project}</span>}
              {ticket.analyst&&<span style={{ color:"#9CA3AF", fontSize:12 }}>· {ticket.analyst}</span>}
              <StatusBadge status={ticket.status} />
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#9CA3AF", fontSize:18, cursor:"pointer", flexShrink:0 }}>✕</button>
        </div>
        <WorkflowTimeline ticket={ticket} />
        {hasQuestions && (
          <div style={{ display:"flex", borderBottom:"1px solid #E5E7EB", marginBottom:20 }}>
            {[{ key:"overview", label:"Résumé" },{ key:"questions", label:`Questions (${result.question_scores.length})` }].map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key)}
                style={{ padding:"9px 18px", background:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:tab===t.key?600:400, color:tab===t.key?"#2563EB":"#6B7280", borderBottom:tab===t.key?"2px solid #2563EB":"2px solid transparent", transition:"all 0.12s" }}>
                {t.label}
              </button>
            ))}
          </div>
        )}
        {tab==="overview"&&(
          <>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
              {[
                { label:"Décision",      value:result.final_decision||"—", color:result.final_decision==="Approved"?"#059669":result.final_decision==="Rejected"?"#DC2626":"#D97706" },
                { label:"Niveau risque", value:result.overall_score||"—",  color:RISK_COLORS[result.overall_score]||"#6B7280" },
                { label:"Score global",  value:result.global_score!=null?`${result.global_score}/4`:"—", color:"#2563EB" },
                { label:"Showstoppers",  value:result.showstopper_count??"—", color:result.showstopper_count>0?"#DC2626":"#059669" },
              ].map(({label,value,color})=>(
                <div key={label} style={{ background:"#F9FAFB", borderRadius:8, padding:"10px 14px", border:"1px solid #E5E7EB" }}>
                  <div style={{ color:"#9CA3AF", fontSize:10, fontWeight:600, letterSpacing:"0.07em", marginBottom:4 }}>{label.toUpperCase()}</div>
                  <div style={{ color, fontSize:16, fontWeight:600 }}>{value}</div>
                </div>
              ))}
            </div>
            {result.executive_summary&&(
              <div style={{ background:"#F9FAFB", borderRadius:8, padding:"12px 14px", marginBottom:14, border:"1px solid #E5E7EB" }}>
                <div style={{ color:"#9CA3AF", fontSize:10, fontWeight:600, letterSpacing:"0.07em", marginBottom:6 }}>RÉSUMÉ EXÉCUTIF</div>
                <p style={{ color:"#374151", fontSize:13, lineHeight:1.7, margin:0 }}>{result.executive_summary}</p>
              </div>
            )}
            {result.showstoppers?.length>0&&(
              <div style={{ marginBottom:14 }}>
                <div style={{ color:"#DC2626", fontSize:10, fontWeight:600, letterSpacing:"0.07em", marginBottom:6 }}>SHOWSTOPPERS</div>
                {result.showstoppers.map((s,i)=>(
                  <div key={i} style={{ background:"#FEF2F2", borderRadius:6, padding:"8px 12px", marginBottom:5, color:"#991B1B", fontSize:12, border:"1px solid #FECACA" }}>⊘ {s}</div>
                ))}
              </div>
            )}
            {hasQuestions&&(
              <div style={{ marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                  <span style={{ color:"#9CA3AF", fontSize:10, fontWeight:600, letterSpacing:"0.07em" }}>APERÇU DES QUESTIONS</span>
                  <button onClick={()=>setTab("questions")} style={{ background:"none", border:"none", color:"#2563EB", fontSize:11, cursor:"pointer", fontWeight:500 }}>Voir toutes ({result.question_scores.length}) →</button>
                </div>
                {result.question_scores.slice(0,4).map(q=>(
                  <div key={q.question_id} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom:"1px solid #F3F4F6" }}>
                    <span style={{ background:SCORE_BG[q.score]||"#F3F4F6", color:SCORE_COLORS[q.score]||"#9CA3AF", fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4, whiteSpace:"nowrap", flexShrink:0, fontFamily:"monospace", border:`1px solid ${(SCORE_COLORS[q.score]||"#9CA3AF")}22` }}>{q.question_id}</span>
                    <div style={{ flex:1, minWidth:0, color:"#374151", fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{q.question}</div>
                    <ScorePill score={q.score} />
                    {q.is_showstopper&&<span style={{ color:"#DC2626", fontSize:11 }}>⊘</span>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {tab==="questions"&&hasQuestions&&<QuestionList questions={result.question_scores} />}
        {isValidation&&(
          <>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#374151", marginBottom:5 }}>Commentaires (optionnel)</label>
              <textarea value={comments} onChange={e=>setComments(e.target.value)} rows={3} placeholder="Ajoutez vos commentaires…"
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, background:"#F9FAFB", border:"1px solid #E5E7EB", color:"#111827", fontSize:13, outline:"none", resize:"vertical", boxSizing:"border-box" }} />
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>send(false)} disabled={loading} style={{ flex:1, padding:"11px 0", borderRadius:8, background:"#FEF2F2", border:"1px solid #FECACA", color:"#DC2626", cursor:"pointer", fontSize:13, fontWeight:600 }}>Rejeter</button>
              <button onClick={()=>send(true)}  disabled={loading} style={{ flex:2, padding:"11px 0", borderRadius:8, background:"#2563EB", border:"none", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600 }}>Approuver & Générer Excel</button>
            </div>
          </>
        )}
        {!isValidation&&(
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
            {ticket.status==="completed"&&(
              <button onClick={()=>window.open(`${API}/tickets/${ticket.id}/download`,"_blank")}
                style={{ padding:"9px 20px", borderRadius:8, background:"#ECFDF5", border:"1px solid #A7F3D0", color:"#059669", cursor:"pointer", fontSize:13, fontWeight:600 }}>⬇ Télécharger Excel</button>
            )}
            <button onClick={onClose} style={{ padding:"9px 20px", borderRadius:8, background:"#F3F4F6", border:"none", color:"#6B7280", cursor:"pointer", fontSize:13, fontWeight:500 }}>Fermer</button>
          </div>
        )}
      </div>
    </div>
  );
}

function TicketRow({ ticket, onSelect }) {
  const activeStep = ticket.workflow_steps?.find(s=>s.status==="running")?.key;
  return (
    <tr onClick={()=>onSelect(ticket)} style={{ cursor:"pointer", borderBottom:"1px solid #F3F4F6" }}
      onMouseEnter={e=>e.currentTarget.style.background="#FAFAFA"}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <td style={{ padding:"12px 16px" }}>
        <div style={{ color:"#111827", fontWeight:500, fontSize:13 }}>{ticket.vendor}</div>
        <div style={{ color:"#9CA3AF", fontSize:11, marginTop:1 }}>{ticket.project||"—"}</div>
      </td>
      <td style={{ padding:"12px 16px", color:"#6B7280", fontSize:12 }}>{ticket.analyst||"—"}</td>
      <td style={{ padding:"12px 16px" }}>
        <span style={{ display:"inline-block", padding:"2px 7px", borderRadius:4, background:"#EFF6FF", color:"#1D4ED8", fontSize:10, fontWeight:600, border:"1px solid #BFDBFE" }}>
          {ticket.source_type?.toUpperCase()||"—"}
        </span>
      </td>
      <td style={{ padding:"12px 16px" }}>
        <StatusBadge status={ticket.status} />
        {ticket.status==="running"&&activeStep&&(
          <div style={{ marginTop:3, fontSize:10, color:"#3B82F6", fontFamily:"monospace" }}>↳ {activeStep}</div>
        )}
      </td>
      <td style={{ padding:"12px 16px", color:"#9CA3AF", fontSize:12 }}>{fmtDate(ticket.created_at)}</td>
      <td style={{ padding:"12px 16px" }}>
        <div style={{ display:"flex", gap:5 }}>
          {ticket.status==="waiting_validation"&&(
            <button onClick={e=>{e.stopPropagation();onSelect(ticket);}}
              style={{ padding:"4px 10px", borderRadius:6, background:"#FFFBEB", border:"1px solid #FDE68A", color:"#D97706", cursor:"pointer", fontSize:11, fontWeight:600 }}>Valider</button>
          )}
          {ticket.status==="completed"&&(
            <button onClick={e=>{e.stopPropagation();window.open(`${API}/tickets/${ticket.id}/download`,"_blank");}}
              style={{ padding:"4px 10px", borderRadius:6, background:"#ECFDF5", border:"1px solid #A7F3D0", color:"#059669", cursor:"pointer", fontSize:11, fontWeight:600 }}>⬇ Excel</button>
          )}
          <button onClick={e=>{e.stopPropagation();onSelect(ticket);}}
            style={{ padding:"4px 10px", borderRadius:6, background:"#F3F4F6", border:"1px solid #E5E7EB", color:"#6B7280", cursor:"pointer", fontSize:11, fontWeight:500 }}>Détails</button>
        </div>
      </td>
    </tr>
  );
}

export default function Dashboard() {
  const [tickets, setTickets]             = useState([]);
  const [filter, setFilter]               = useState("all");
  const [showUpload, setShowUpload]       = useState(false);
  const [trackingId, setTrackingId]       = useState(null);
  const [selected, setSelected]           = useState(null);
  const [loading, setLoading]             = useState(true);
  const [lastRefresh, setLastRefresh]     = useState(Date.now());

  const fetchTickets = useCallback(async () => {
    try {
      const url = filter==="all" ? `${API}/tickets` : `${API}/tickets?status=${filter}`;
      const res = await fetch(url);
      setTickets(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets, lastRefresh]);
  useEffect(() => {
    const hasActive = tickets.some(t=>["running","waiting_validation"].includes(t.status));
    if (!hasActive) return;
    const id = setInterval(()=>setLastRefresh(Date.now()), 10000);
    return () => clearInterval(id);
  }, [tickets]);

  const counts = tickets.reduce((acc,t) => { acc[t.status]=(acc[t.status]||0)+1; return acc; }, {});

  const FILTERS = [
    { key:"all",                label:"Tous",       count:tickets.length },
    { key:"pending",            label:"En attente", count:counts.pending||0 },
    { key:"running",            label:"En cours",   count:counts.running||0 },
    { key:"waiting_validation", label:"À valider",  count:counts.waiting_validation||0 },
    { key:"completed",          label:"Terminés",   count:counts.completed||0 },
    { key:"rejected",           label:"Rejetés",    count:counts.rejected||0 },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#F9FAFB", color:"#111827", fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:#F3F4F6; }
        ::-webkit-scrollbar-thumb { background:#D1D5DB; border-radius:2px; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
        tbody tr { animation:fadeUp 0.15s ease; }
      `}</style>

      <header style={{ background:"#fff", borderBottom:"1px solid #E5E7EB", padding:"0 32px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:"#2563EB", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>🛡</div>
          <div>
            <div style={{ fontWeight:600, fontSize:14, color:"#111827" }}>TPRA Platform</div>
            <div style={{ color:"#9CA3AF", fontSize:10 }}>Third Party Risk Assessment</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>setLastRefresh(Date.now())}
            style={{ padding:"6px 12px", borderRadius:7, background:"#F3F4F6", border:"1px solid #E5E7EB", color:"#6B7280", cursor:"pointer", fontSize:12, fontWeight:500 }}>↻ Actualiser</button>
          <button onClick={()=>setShowUpload(true)}
            style={{ padding:"6px 16px", borderRadius:7, background:"#2563EB", border:"none", color:"#fff", cursor:"pointer", fontSize:12, fontWeight:600 }}>+ Nouveau ticket</button>
        </div>
      </header>

      <div style={{ padding:"24px 32px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
          {[
            { label:"Total",     value:tickets.length,                 color:"#1D4ED8", border:"#BFDBFE" },
            { label:"En cours",  value:counts.running||0,              color:"#D97706", border:"#FDE68A" },
            { label:"À valider", value:counts.waiting_validation||0,   color:"#D97706", border:"#FDE68A" },
            { label:"Terminés",  value:counts.completed||0,            color:"#059669", border:"#A7F3D0" },
          ].map(({label,value,color,border})=>(
            <div key={label} style={{ background:"#fff", border:`1px solid ${border}`, borderRadius:10, padding:"14px 18px" }}>
              <div style={{ color:"#9CA3AF", fontSize:10, fontWeight:600, letterSpacing:"0.07em", marginBottom:5 }}>{label.toUpperCase()}</div>
              <div style={{ color, fontSize:26, fontWeight:700, lineHeight:1 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", gap:3, marginBottom:14 }}>
          {FILTERS.map(({key,label,count})=>(
            <button key={key} onClick={()=>setFilter(key)}
              style={{ padding:"5px 12px", borderRadius:7, cursor:"pointer", fontSize:12, fontWeight:filter===key?600:400, background:filter===key?"#fff":"transparent", border:filter===key?"1px solid #E5E7EB":"1px solid transparent", color:filter===key?"#111827":"#9CA3AF", transition:"all 0.12s" }}>
              {label}{count>0&&<span style={{ marginLeft:4, padding:"0 5px", borderRadius:8, background:"#F3F4F6", fontSize:10, color:"#6B7280" }}>{count}</span>}
            </button>
          ))}
        </div>

        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #E5E7EB", overflow:"hidden" }}>
          {loading ? (
            <div style={{ padding:48, textAlign:"center", color:"#9CA3AF", fontSize:13 }}>Chargement…</div>
          ) : tickets.length===0 ? (
            <div style={{ padding:64, textAlign:"center" }}>
              <div style={{ fontSize:36, marginBottom:10 }}>📋</div>
              <div style={{ color:"#9CA3AF", fontSize:13, marginBottom:16 }}>Aucun ticket pour l'instant</div>
              <button onClick={()=>setShowUpload(true)} style={{ padding:"8px 18px", borderRadius:8, background:"#2563EB", border:"none", color:"#fff", cursor:"pointer", fontSize:12, fontWeight:600 }}>Créer le premier ticket</button>
            </div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#F9FAFB", borderBottom:"1px solid #E5E7EB" }}>
                  {["Fournisseur / Projet","Analyste","Type","Statut","Créé le","Actions"].map(h=>(
                    <th key={h} style={{ padding:"10px 16px", textAlign:"left", color:"#9CA3AF", fontSize:10, fontWeight:600, letterSpacing:"0.07em" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map(t=><TicketRow key={t.id} ticket={t} onSelect={setSelected} />)}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showUpload && (
        <UploadModal
          onClose={()=>setShowUpload(false)}
          onLaunched={id=>{ setShowUpload(false); setTrackingId(id); setLastRefresh(Date.now()); }}
        />
      )}

      {trackingId && (
        <LiveTrackingModal
          ticketId={trackingId}
          onClose={()=>{ setTrackingId(null); setLastRefresh(Date.now()); }}
          onRefreshList={()=>setLastRefresh(Date.now())}
        />
      )}

      {selected && (
        <DetailModal
          ticket={selected}
          onClose={()=>setSelected(null)}
          onDone={()=>{ setSelected(null); setLastRefresh(Date.now()); }}
        />
      )}
    </div>
  );
}