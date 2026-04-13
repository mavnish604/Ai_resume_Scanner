"use client";

import { useState, useRef, useCallback } from "react";

const API_BASE = "http://localhost:8000";
const MODEL_NAMES = ["Llama 70B", "GPT-OSS 120B", "Llama 70B v2"];
const EMOJI_REGEX = /[\p{Extended_Pictographic}\u200D\uFE0F]/gu;
const ROLE_SUGGESTIONS = [
  "Full Stack Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Cloud Architect",
  "Product Manager",
  "Mobile Developer",
  "Cybersecurity Analyst",
  "Data Engineer",
  "AI Research Scientist",
];

function stripEmojis(value = "") {
  if (typeof value !== "string") return "";
  return value.replace(EMOJI_REGEX, "").trim();
}

function sanitizeCandidate(candidate) {
  if (!candidate || typeof candidate !== "object") return candidate;

  return {
    ...candidate,
    filename: stripEmojis(candidate.filename || ""),
    error: stripEmojis(candidate.error || ""),
    structure_feedback: stripEmojis(candidate.structure_feedback || ""),
    llm_summary: stripEmojis(candidate.llm_summary || ""),
    llm_improvements: Array.isArray(candidate.llm_improvements)
      ? candidate.llm_improvements
          .map((item) => stripEmojis(item || ""))
          .filter(Boolean)
      : [],
  };
}

/* ── Animated circular score ring ─────────────────────── */
function ScoreRing({ value, size = 160, stroke = 8, color = "url(#grad)" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="score-ring-container">
      <svg className="score-ring" width={size} height={size}>
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <circle className="score-ring-bg" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle
          className="score-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          stroke={color}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="score-value">{value}</span>
    </div>
  );
}

function MiniScoreRing({ value, size = 90, stroke = 5, color }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="mini-ring-container">
      <svg className="mini-ring" width={size} height={size}>
        <circle className="score-ring-bg" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle
          className="score-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          stroke={color}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="score-num">{value}</span>
    </div>
  );
}

export default function Home() {
  const [files, setFiles] = useState([]);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [generatingJd, setGeneratingJd] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const fileInput = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith(".pdf"));
    if (dropped.length > 0) {
      setFiles((prev) => [...prev, ...dropped]);
    }
  }, []);

  const handleSubmit = async () => {
    if (files.length === 0 || !jd.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedIndex(null);

    const formData = new FormData();
    files.forEach((f) => formData.append("pdf_files", f));
    formData.append("job_description", jd);

    try {
      const res = await fetch(`${API_BASE}/batch-score`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server returned ${res.status}`);
      }
      const data = await res.json();
      setResult({
        ...data,
        ranked_candidates: Array.isArray(data.ranked_candidates)
          ? data.ranked_candidates.map(sanitizeCandidate)
          : [],
      });
    } catch (e) {
      setError(stripEmojis(e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateJd = async () => {
    if (!selectedRole.trim()) return;
    setGeneratingJd(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("role", selectedRole.trim());
      const res = await fetch(`${API_BASE}/generate-jd`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server returned ${res.status}`);
      }
      const data = await res.json();
      setJd(stripEmojis(data.job_description || ""));
    } catch (e) {
      setError(stripEmojis(e.message));
    } finally {
      setGeneratingJd(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setFiles([]);
    setJd("");
    setSelectedRole("");
    setGeneratingJd(false);
    setExpandedIndex(null);
  };

  /* ── Results view ────────────────────────── */
  if (result && result.ranked_candidates) {
    return (
      <div className="container" style={{ maxWidth: "1000px" }}>
        <button className="back-btn" onClick={reset}>
          New Scan
        </button>
        <div className="leaderboard-header" style={{ textAlign: "center", marginBottom: "32px" }}>
          <h2 style={{ fontSize: "2.2rem", color: "var(--accent-cyan)", marginBottom: "8px" }}>Candidate Leaderboard</h2>
          <p style={{ color: "var(--text-secondary)" }}>Ranked by final ATS Score against Job Description</p>
        </div>

        <div className="leaderboard-list">
          {result.ranked_candidates.map((candidate, idx) => {
            const isExpanded = expandedIndex === idx;

            if (candidate.error) {
              return (
                <div key={idx} className="glass-card leaderboard-item error-item" style={{ marginBottom: "16px", padding: "20px" }}>
                  <div className="leaderboard-summary" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div className="rank" style={{ fontSize: "1.2rem", fontWeight: "bold", opacity: 0.5 }}>#{idx + 1}</div>
                    <div className="candidate-info" style={{ flex: 1 }}>
                      <h4 style={{ fontSize: "1.1rem", margin: "0 0 4px" }}>{candidate.filename || "Resume"}</h4>
                      <span className="error-text" style={{ color: "#ef4444", fontSize: "0.9rem" }}>{candidate.error || "Unable to process this file."}</span>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={idx} className={`glass-card leaderboard-item ${isExpanded ? 'expanded' : ''}`} style={{ marginBottom: "16px", padding: "20px", transition: "all 0.3s ease" }}>
                <div
                  className="leaderboard-summary"
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "20px" }}
                >
                  <div className="rank" style={{ fontSize: "1.8rem", fontWeight: "900", color: idx === 0 ? "var(--accent-pink)" : "var(--accent-purple)", width: "50px", textAlign: "center" }}>
                    #{idx + 1}
                  </div>
                  <div className="candidate-info" style={{ flex: 1 }}>
                    <h4 style={{ fontSize: "1.15rem", margin: "0", color: "var(--text-primary)" }}>{candidate.filename || "Resume"}</h4>
                  </div>
                  <div className="candidate-score" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <MiniScoreRing value={Math.round(candidate.final_score)} color="#ec4899" size={60} stroke={5} />
                    <span className="expand-icon" style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>{isExpanded ? 'Collapse' : 'Expand'}</span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="expanded-details" style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--glass-border)", animation: "fadeIn 0.3s ease" }}>
                    {/* Three sub-scores */}
                    <div className="score-grid" style={{ marginBottom: "24px" }}>
                      <div className="glass-card score-card" style={{ padding: "16px" }}>
                        <MiniScoreRing value={Math.round(candidate.llm_avg_score)} color="#8b5cf6" size={70} stroke={5} />
                        <div className="score-card-title">LLM (70%)</div>
                      </div>
                      <div className="glass-card score-card" style={{ padding: "16px" }}>
                        <MiniScoreRing value={Math.round(candidate.structure_score)} color="#00d4ff" size={70} stroke={5} />
                        <div className="score-card-title">Structure (20%)</div>
                      </div>
                      <div className="glass-card score-card" style={{ padding: "16px" }}>
                        <MiniScoreRing value={Math.round(candidate.semantic_score)} color="#10b981" size={70} stroke={5} />
                        <div className="score-card-title">Semantic (10%)</div>
                      </div>
                    </div>

                    {/* Unified Summary */}
                    {candidate.llm_summary && (
                      <div className="feedback-section" style={{ marginBottom: "16px" }}>
                        <div className="glass-card feedback-card" style={{ padding: "20px" }}>
                          <h3 style={{ marginBottom: "12px" }}><span className="tag-pink">AI Summary</span></h3>
                          <p className="feedback-text">{candidate.llm_summary}</p>
                        </div>
                      </div>
                    )}

                    {/* Structure Feedback */}
                    {candidate.structure_feedback && (
                      <div className="feedback-section" style={{ marginBottom: "16px" }}>
                        <div className="glass-card feedback-card" style={{ padding: "20px" }}>
                          <h3 style={{ marginBottom: "12px" }}><span className="tag-cyan">Layout Feedback</span></h3>
                          <p className="feedback-text">{candidate.structure_feedback}</p>
                        </div>
                      </div>
                    )}

                    {/* Improvements */}
                    {candidate.llm_improvements && candidate.llm_improvements.length > 0 && (
                      <div className="feedback-section">
                        <div className="glass-card feedback-card" style={{ padding: "20px" }}>
                          <h3 style={{ marginBottom: "12px" }}><span className="tag-orange">Top Improvements</span></h3>
                          <ul style={{ color: "var(--text-secondary)", fontSize: "0.9rem", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            {candidate.llm_improvements.map((imp, i) => (
                              <li key={i}>{imp}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Input form view ─────────────────────── */
  return (
    <div className="container">
      <header className="header">
        <div className="logo-badge">
          <span className="dot"></span>
          AI Resume Scanner
        </div>
        <h1>ATS Resume Analyzer</h1>
        <p>
          Upload your resumes and job description to get instant AI-powered
          rankings with detailed feedback from multiple models.
        </p>
      </header>

      <div className="glass-card">
        {/* PDF Upload */}
        <div
          className={`upload-zone ${dragging ? "dragging" : ""} ${files.length > 0 ? "has-file" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInput.current?.click()}
        >
          <input
            ref={fileInput}
            type="file"
            accept=".pdf"
            multiple
            webkitdirectory="true"
            hidden
            onChange={(e) => setFiles(Array.from(e.target.files))}
          />
          <div className="upload-icon"></div>
          {files.length > 0 ? (
            <>
              <h3 style={{ color: "var(--accent-green)", fontSize: "1.2rem" }}>{files.length} File{files.length > 1 ? 's' : ''} Selected</h3>
              <p>Click or drag to replace selection</p>
              <div style={{ marginTop: "12px", maxHeight: "80px", overflowY: "auto", display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                {files.slice(0, 5).map(f => (
                  <span key={f.name} className="file-name" style={{ margin: 0 }}>{stripEmojis(f.name) || "Unnamed file"}</span>
                ))}
                {files.length > 5 && <span className="file-name" style={{ margin: 0, opacity: 0.7 }}>+ {files.length - 5} more</span>}
              </div>
            </>
          ) : (
            <>
              <h3>Drop a folder of resumes here</h3>
              <p>or click to browse a directory (.pdf files)</p>
            </>
          )}
        </div>

        {/* Job Description */}
        <div className="form-section">
          <label className="field-label">Job Description</label>
          <textarea
            className="jd-textarea"
            placeholder="Paste the full job description here..."
            value={jd}
            onChange={(e) => setJd(stripEmojis(e.target.value))}
          />
        </div>

        {/* JD Generator */}
        <div className="form-section jd-generator-section">
          <label className="field-label">Or generate a JD with AI</label>
          <div className="jd-gen-row">
            <div className="role-input-wrapper">
              <input
                type="text"
                list="role-suggestions"
                className="role-input"
                placeholder="Type or select a role…"
                value={selectedRole}
                onChange={(e) => setSelectedRole(stripEmojis(e.target.value))}
              />
              <datalist id="role-suggestions">
                {ROLE_SUGGESTIONS.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
            <button
              className="generate-btn"
              disabled={!selectedRole.trim() || generatingJd}
              onClick={handleGenerateJd}
            >
              {generatingJd ? (
                <><span className="btn-spinner"></span> Generating…</>
              ) : (
                "Generate JD"
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="form-section">
          <button
            className="submit-btn"
            disabled={files.length === 0 || !jd.trim() || loading || generatingJd}
            onClick={handleSubmit}
          >
            {loading ? `Analyzing ${files.length} resume${files.length > 1 ? 's' : ''}...` : "Rank Recommendations"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <h3>Analyzing {files.length} candidate resumes...</h3>
            <p>Running multi-stage ensemble extraction & scoring. This may take a bit for multiple files.</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-card">
            <h3>Analysis Failed</h3>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
