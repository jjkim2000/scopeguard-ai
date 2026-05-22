import { useState, useRef } from "react";

const severityColor = (s) =>
  ({
    HIGH: { bg: "#1e0a0a", border: "#dc2626", text: "#f87171", badge: "#7f1d1d" },
    MEDIUM: { bg: "#1c1200", border: "#d97706", text: "#fbbf24", badge: "#78350f" },
    LOW: { bg: "#0a1628", border: "#2563eb", text: "#60a5fa", badge: "#1e3a5f" },
  }[s] || { bg: "#111", border: "#444", text: "#888", badge: "#333" });

const costColor = (c) =>
  ({ high: "#f87171", medium: "#fbbf24", low: "#4ade80", unknown: "#6b7280" }[c] || "#6b7280");

const riskColor = (score) => {
  if (score >= 8) return "#ef4444";
  if (score >= 5) return "#f59e0b";
  return "#22c55e";
};

export default function ScopeGuardAI() {
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState("gaps");
  const fileRef = useRef();

  const readFileAsBase64 = (file) =>
    new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = (e) => res(e.target.result.split(",")[1]);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });

  const handleFiles = (incoming) => {
    const arr = Array.from(incoming);
    setFiles((prev) => [
      ...prev,
      ...arr.map((f) => ({ file: f, id: Math.random() })),
    ]);
  };

  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const analyze = async () => {
    if (files.length === 0 && !notes.trim()) {
      setError("Please upload at least one document or enter project notes.");
      return;
    }
    setError("");
    setLoading(true);
    setResults(null);

    try {
      const filesPayload = await Promise.all(
        files.map(async ({ file }) => ({
          name: file.name,
          type: file.type,
          data: await readFileAsBase64(file),
        }))
      );

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: filesPayload, notes }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Server error");
      }

      const parsed = await response.json();
      setResults(parsed);
      setActiveTab("gaps");
    } catch (e) {
      setError("Analysis failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "gaps", label: "Scope Gaps", count: results?.scopeGaps?.length },
    { id: "co", label: "Change Orders", count: results?.changeOrderRisks?.length },
    { id: "resp", label: "Responsibility", count: results?.responsibilityConflicts?.length },
    { id: "permit", label: "Permit Risks", count: results?.permitRisks?.length },
    { id: "clean", label: "Clear Items", count: results?.cleanItems?.length },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "Arial, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .upload-zone:hover { border-color: #2563eb !important; background: #eff6ff !important; }
        .file-row:hover { background: #f8fafc !important; }
        .analyze-btn:hover:not(:disabled) {
          background: #1d4ed8 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 20px #2563eb44;
        }
        .tab-btn:hover { background: #e0e7ff !important; color: #2563eb !important; }
        .finding-card { transition: transform 0.15s, box-shadow 0.15s; }
        .finding-card:hover { transform: translateX(3px); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
        .remove-btn:hover { color: #ef4444 !important; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .loading-dot { animation: pulse 1.4s infinite; }
        .loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .loading-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      {/* NAVBAR */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #e2e8f0",
        padding: "0 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: "64px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: 38, height: 38,
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: "900", fontSize: "18px",
            boxShadow: "0 2px 8px #2563eb44",
          }}>S</div>
          <div>
            <div style={{ fontWeight: "900", fontSize: "18px", color: "#0f172a", letterSpacing: "0.5px" }}>
              ScopeGuard <span style={{ color: "#2563eb" }}>AI</span>
            </div>
            <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "1px", marginTop: "-1px" }}>
              SCOPE REVIEW & CHANGE ORDER DETECTION
            </div>
          </div>
        </div>
        <div style={{
          background: "#eff6ff", border: "1px solid #bfdbfe",
          borderRadius: "20px", padding: "5px 14px",
          fontSize: "11px", color: "#2563eb", fontWeight: "700", letterSpacing: "1px",
        }}>
          LOW VOLTAGE SECURITY SYSTEMS
        </div>
      </div>

      {/* HERO */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)",
        padding: "56px 40px",
        textAlign: "center",
        color: "#fff",
      }}>
        <div style={{
          display: "inline-block",
          background: "#ffffff18", border: "1px solid #ffffff30",
          borderRadius: "20px", padding: "5px 16px",
          fontSize: "11px", letterSpacing: "2px", color: "#bfdbfe",
          marginBottom: "20px",
        }}>AI-POWERED · BUILT FOR INTEGRATORS</div>
        <h1 style={{ fontSize: "42px", fontWeight: "900", margin: "0 0 14px", lineHeight: 1.2 }}>
          Catch Scope Gaps<br />
          <span style={{ color: "#93c5fd" }}>Before They Cost You</span>
        </h1>
        <p style={{ fontSize: "16px", color: "#bfdbfe", maxWidth: "520px", margin: "0 auto 28px", lineHeight: 1.6 }}>
          Upload your SOW, hardware schedules, floor plans, and emails. ScopeGuard AI identifies missing hardware, change order risks, and unclear responsibilities in seconds.
        </p>
        <div style={{ display: "flex", gap: "24px", justifyContent: "center", flexWrap: "wrap" }}>
          {["Missing Hardware Detection", "Change Order Alerts", "Responsibility Conflicts", "Permit Risk Flags"].map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#dbeafe" }}>
              <span style={{ color: "#60a5fa", fontSize: "16px" }}>✓</span> {f}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>

        {/* UPLOAD CARD */}
        <div style={{
          background: "#fff", borderRadius: "16px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          border: "1px solid #e2e8f0",
          padding: "32px", marginBottom: "24px",
        }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px" }}>
            <div style={{
              width: 32, height: 32, background: "#eff6ff",
              borderRadius: "8px", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "16px",
            }}>📁</div>
            <div>
              <div style={{ fontWeight: "800", fontSize: "16px", color: "#0f172a" }}>Upload Project Documents</div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>SOW, hardware schedules, floor plans, emails, submittals</div>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            className="upload-zone"
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current.click()}
            style={{
              border: `2px dashed ${dragOver ? "#2563eb" : "#cbd5e1"}`,
              borderRadius: "12px", padding: "36px 24px",
              textAlign: "center", cursor: "pointer",
              background: dragOver ? "#eff6ff" : "#f8fafc",
              transition: "all 0.2s", marginBottom: "16px",
            }}
          >
            <input ref={fileRef} type="file" multiple accept=".pdf,.txt,.doc,.docx,.csv,.xlsx,.xls"
              style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>☁️</div>
            <div style={{ fontWeight: "700", color: "#2563eb", fontSize: "14px", marginBottom: "6px" }}>
              Click to upload or drag & drop
            </div>
            <div style={{ fontSize: "12px", color: "#94a3b8" }}>
              PDF · DOCX · TXT · XLSX · CSV — up to 20MB per file
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div style={{
              border: "1px solid #e2e8f0", borderRadius: "10px",
              overflow: "hidden", marginBottom: "16px",
            }}>
              {files.map(({ file, id }, i) => (
                <div key={id} className="file-row" style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 16px",
                  borderBottom: i < files.length - 1 ? "1px solid #f1f5f9" : "none",
                  background: "#fff", transition: "background 0.15s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: 28, height: 28, background: "#eff6ff",
                      borderRadius: "6px", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: "13px",
                    }}>
                      {file.name.endsWith(".pdf") ? "📄" : file.name.endsWith(".xlsx") || file.name.endsWith(".csv") ? "📊" : "📝"}
                    </div>
                    <span style={{ fontSize: "13px", color: "#334155", fontWeight: "600" }}>{file.name}</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <button className="remove-btn" onClick={() => removeFile(id)} style={{
                    background: "none", border: "none", color: "#cbd5e1",
                    cursor: "pointer", fontSize: "18px", lineHeight: 1,
                    transition: "color 0.15s", padding: "0 4px",
                  }}>×</button>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional: describe the project, GC involved, specific concerns, or paste scope text directly here..."
            style={{
              width: "100%", minHeight: "90px",
              border: "1px solid #e2e8f0", borderRadius: "10px",
              padding: "12px 16px", fontSize: "13px",
              color: "#334155", fontFamily: "Arial, sans-serif",
              lineHeight: 1.6, resize: "vertical", outline: "none",
              background: "#f8fafc", marginBottom: "16px",
            }}
          />

          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: "8px", padding: "12px 16px",
              color: "#ef4444", fontSize: "13px", marginBottom: "16px",
            }}>{error}</div>
          )}

          <button className="analyze-btn" onClick={analyze} disabled={loading} style={{
            width: "100%", padding: "16px",
            background: loading ? "#94a3b8" : "#2563eb",
            border: "none", borderRadius: "10px",
            color: "#fff", fontFamily: "Arial, sans-serif",
            fontWeight: "800", fontSize: "14px", letterSpacing: "1px",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
          }}>
            {loading ? (
              <>
                <span>Analyzing your documents</span>
                <span style={{ display: "flex", gap: "3px" }}>
                  {[0,1,2].map(i => <span key={i} className="loading-dot" style={{ width: 6, height: 6, background: "#fff", borderRadius: "50%", display: "inline-block" }} />)}
                </span>
              </>
            ) : (
              <> 🔍 &nbsp; Analyze for Scope Gaps & Change Orders </>
            )}
          </button>
        </div>

        {/* RESULTS */}
        {results && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>

            {/* Summary */}
            <div style={{
              background: "#fff", borderRadius: "16px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
              border: "1px solid #e2e8f0",
              padding: "28px 32px", marginBottom: "20px",
              display: "flex", gap: "28px", alignItems: "center",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "20px" }}>📋</span>
                  <span style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>Executive Summary</span>
                </div>
                <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.7, margin: 0 }}>{results.summary}</p>
              </div>
              <div style={{
                textAlign: "center", minWidth: "100px",
                background: `${riskColor(results.riskScore)}11`,
                border: `2px solid ${riskColor(results.riskScore)}44`,
                borderRadius: "14px", padding: "16px 12px",
              }}>
                <div style={{
                  fontSize: "52px", fontWeight: "900", lineHeight: 1,
                  color: riskColor(results.riskScore),
                }}>{results.riskScore}</div>
                <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "700", letterSpacing: "1px", marginTop: "4px" }}>
                  RISK SCORE<br />
                  <span style={{ color: riskColor(results.riskScore), fontSize: "11px" }}>
                    {results.riskScore >= 8 ? "HIGH" : results.riskScore >= 5 ? "MEDIUM" : "LOW"}
                  </span>
                </div>
              </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
              {[
                { label: "Scope Gaps", val: results.scopeGaps?.length || 0, color: "#ef4444", bg: "#fef2f2", icon: "⚠️" },
                { label: "Change Order Risks", val: results.changeOrderRisks?.length || 0, color: "#f59e0b", bg: "#fffbeb", icon: "💰" },
                { label: "Conflicts", val: results.responsibilityConflicts?.length || 0, color: "#8b5cf6", bg: "#f5f3ff", icon: "🤝" },
                { label: "Permit Risks", val: results.permitRisks?.length || 0, color: "#ef4444", bg: "#fef2f2", icon: "🏛️" },
              ].map((s) => (
                <div key={s.label} style={{
                  background: "#fff", border: "1px solid #e2e8f0",
                  borderRadius: "12px", padding: "20px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}>
                  <div style={{ fontSize: "22px", marginBottom: "6px" }}>{s.icon}</div>
                  <div style={{ fontSize: "36px", fontWeight: "900", color: s.color, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700", marginTop: "4px" }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{
              background: "#fff", borderRadius: "16px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
              border: "1px solid #e2e8f0", overflow: "hidden",
            }}>
              <div style={{
                display: "flex", gap: "0",
                borderBottom: "1px solid #e2e8f0",
                background: "#f8fafc", padding: "0 8px",
                overflowX: "auto",
              }}>
                {tabs.map((t) => (
                  <button key={t.id} className="tab-btn" onClick={() => setActiveTab(t.id)} style={{
                    background: activeTab === t.id ? "#fff" : "none",
                    border: "none",
                    borderBottom: activeTab === t.id ? "2px solid #2563eb" : "2px solid transparent",
                    color: activeTab === t.id ? "#2563eb" : "#64748b",
                    fontFamily: "Arial, sans-serif",
                    fontWeight: activeTab === t.id ? "800" : "600",
                    fontSize: "12px", letterSpacing: "0.3px",
                    padding: "14px 18px", cursor: "pointer",
                    transition: "all 0.15s", whiteSpace: "nowrap",
                    marginBottom: "-1px",
                  }}>
                    {t.label} {t.count > 0 ? <span style={{
                      background: activeTab === t.id ? "#dbeafe" : "#f1f5f9",
                      color: activeTab === t.id ? "#2563eb" : "#94a3b8",
                      borderRadius: "10px", padding: "1px 7px",
                      fontSize: "11px", marginLeft: "4px",
                    }}>{t.count}</span> : ""}
                  </button>
                ))}
              </div>

              <div style={{ padding: "24px" }}>

                {/* Scope Gaps */}
                {activeTab === "gaps" && (results.scopeGaps || []).map((g) => {
                  const c = severityColor(g.severity);
                  return (
                    <div key={g.id} className="finding-card" style={{
                      background: c.bg, border: `1px solid ${c.border}33`,
                      borderLeft: `4px solid ${c.border}`,
                      borderRadius: "10px", padding: "18px 20px", marginBottom: "12px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                        <span style={{
                          background: c.badge, color: c.text,
                          fontSize: "10px", fontWeight: "800", letterSpacing: "1px",
                          padding: "3px 10px", borderRadius: "20px",
                        }}>{g.severity}</span>
                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "700" }}>
                          {g.category?.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: "13px", color: "#1e293b", marginBottom: "10px", lineHeight: 1.6, fontWeight: "600" }}>
                        {g.finding}
                      </div>
                      <div style={{
                        fontSize: "12px", color: "#64748b",
                        background: "#ffffff60", borderRadius: "6px",
                        padding: "10px 12px", borderLeft: "3px solid #94a3b8",
                      }}>
                        <strong>Recommendation:</strong> {g.recommendation}
                      </div>
                    </div>
                  );
                })}

                {/* Change Orders */}
                {activeTab === "co" && (results.changeOrderRisks || []).map((c) => (
                  <div key={c.id} className="finding-card" style={{
                    background: "#fffbeb", border: "1px solid #fde68a",
                    borderLeft: "4px solid #f59e0b",
                    borderRadius: "10px", padding: "18px 20px", marginBottom: "12px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{
                        background: "#78350f", color: "#fbbf24",
                        fontSize: "10px", fontWeight: "800", letterSpacing: "1px",
                        padding: "3px 10px", borderRadius: "20px",
                      }}>CHANGE ORDER RISK</span>
                      <span style={{
                        fontSize: "11px", fontWeight: "800", color: costColor(c.estimatedCost),
                      }}>COST IMPACT: {c.estimatedCost?.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#1e293b", marginBottom: "10px", lineHeight: 1.6, fontWeight: "600" }}>
                      {c.finding}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", background: "#ffffff60", borderRadius: "6px", padding: "10px 12px", borderLeft: "3px solid #f59e0b" }}>
                      <strong>Mitigation:</strong> {c.recommendation}
                    </div>
                  </div>
                ))}

                {/* Responsibility */}
                {activeTab === "resp" && (results.responsibilityConflicts || []).map((r) => (
                  <div key={r.id} className="finding-card" style={{
                    background: "#f5f3ff", border: "1px solid #ddd6fe",
                    borderLeft: "4px solid #8b5cf6",
                    borderRadius: "10px", padding: "18px 20px", marginBottom: "12px",
                  }}>
                    <div style={{ marginBottom: "10px" }}>
                      <span style={{
                        background: "#4c1d95", color: "#c4b5fd",
                        fontSize: "10px", fontWeight: "800", letterSpacing: "1px",
                        padding: "3px 10px", borderRadius: "20px",
                      }}>CONFLICT: {r.parties?.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#1e293b", marginBottom: "10px", lineHeight: 1.6, fontWeight: "600" }}>
                      {r.issue}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", background: "#ffffff60", borderRadius: "6px", padding: "10px 12px", borderLeft: "3px solid #8b5cf6" }}>
                      <strong>Resolution:</strong> {r.recommendation}
                    </div>
                  </div>
                ))}

                {/* Permit Risks */}
                {activeTab === "permit" && (results.permitRisks || []).map((p) => (
                  <div key={p.id} className="finding-card" style={{
                    background: "#fef2f2", border: "1px solid #fecaca",
                    borderLeft: "4px solid #ef4444",
                    borderRadius: "10px", padding: "18px 20px", marginBottom: "12px",
                  }}>
                    <div style={{ marginBottom: "10px" }}>
                      <span style={{
                        background: "#7f1d1d", color: "#fca5a5",
                        fontSize: "10px", fontWeight: "800", letterSpacing: "1px",
                        padding: "3px 10px", borderRadius: "20px",
                      }}>PERMIT / AHJ RISK</span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#1e293b", marginBottom: "10px", lineHeight: 1.6, fontWeight: "600" }}>
                      {p.finding}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", background: "#ffffff60", borderRadius: "6px", padding: "10px 12px", borderLeft: "3px solid #ef4444" }}>
                      <strong>Action Required:</strong> {p.recommendation}
                    </div>
                  </div>
                ))}

                {/* Clean Items */}
                {activeTab === "clean" && (
                  <div style={{
                    background: "#f0fdf4", border: "1px solid #bbf7d0",
                    borderRadius: "10px", padding: "20px 24px",
                  }}>
                    <div style={{ fontWeight: "800", color: "#166534", fontSize: "14px", marginBottom: "14px" }}>
                      ✅ Properly Scoped Items
                    </div>
                    {(results.cleanItems || []).map((item, i) => (
                      <div key={i} style={{
                        display: "flex", gap: "10px", alignItems: "flex-start",
                        marginBottom: "10px", fontSize: "13px", color: "#374151", lineHeight: 1.6,
                      }}>
                        <span style={{ color: "#22c55e", fontSize: "16px", marginTop: "1px" }}>✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {((activeTab === "gaps" && !results.scopeGaps?.length) ||
                  (activeTab === "co" && !results.changeOrderRisks?.length) ||
                  (activeTab === "resp" && !results.responsibilityConflicts?.length) ||
                  (activeTab === "permit" && !results.permitRisks?.length)) && (
                  <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
                    <div style={{ fontSize: "36px", marginBottom: "10px" }}>✅</div>
                    <div style={{ fontWeight: "700", fontSize: "14px" }}>No issues detected in this category</div>
                  </div>
                )}
              </div>
            </div>

            {/* Reset */}
            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <button onClick={() => { setResults(null); setFiles([]); setNotes(""); }} style={{
                background: "none", border: "1px solid #cbd5e1",
                borderRadius: "8px", padding: "10px 24px",
                color: "#64748b", fontFamily: "Arial, sans-serif",
                fontSize: "13px", cursor: "pointer", fontWeight: "600",
              }}>
                ← Start New Analysis
              </button>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{
          marginTop: "48px", paddingTop: "24px",
          borderTop: "1px solid #e2e8f0",
          textAlign: "center", fontSize: "12px", color: "#94a3b8",
        }}>
          ScopeGuard AI · Built for Low Voltage Security Integrators ·{" "}
          <span style={{ color: "#2563eb" }}>Powered by Claude AI</span>
        </div>
      </div>
    </div>
  );
}
