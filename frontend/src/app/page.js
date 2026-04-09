"use client";

import { useState, useRef, useCallback } from "react";

const API_BASE = "http://localhost:8000";
const MODEL_NAMES = ["Llama 70B", "GPT-OSS 120B", "Llama 70B v2"];
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
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [generatingJd, setGeneratingJd] = useState(false);
  const fileInput = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.name.toLowerCase().endsWith(".pdf")) {
      setFile(dropped);
    }
  }, []);

  const handleSubmit = async () => {
    if (!file || !jd.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("pdf_file", file);
    formData.append("job_description", jd);

    try {
      const res = await fetch(`${API_BASE}/final-score`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server returned ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
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
      setJd(data.job_description || "");
    } catch (e) {
      setError(e.message);
    } finally {
      setGeneratingJd(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setFile(null);
    setJd("");
    setSelectedRole("");
    setGeneratingJd(false);
  };

  /* ── Results view ────────────────────────── */
  if (result) {
    return (
      <div className="container">
        <button className="back-btn" onClick={reset}>
          ← New Scan
        </button>

        {/* Final Score */}
        <div className="final-score-card">
          <ScoreRing value={Math.round(result.final_score)} />
          <div className="score-label">Final ATS Score</div>
        </div>

        {/* Three sub-scores */}
        <div className="score-grid">
          <div className="glass-card score-card">
            <MiniScoreRing value={Math.round(result.llm_avg_score)} color="#8b5cf6" />
            <div className="score-card-title">LLM Score (70%)</div>
          </div>
          <div className="glass-card score-card">
            <MiniScoreRing value={Math.round(result.structure_score)} color="#00d4ff" />
            <div className="score-card-title">Structure (20%)</div>
          </div>
          <div className="glass-card score-card">
            <MiniScoreRing value={Math.round(result.semantic_score)} color="#10b981" />
            <div className="score-card-title">Semantic (10%)</div>
          </div>
        </div>

        {/* Individual LLM Scores */}
        {result.llm_individual_scores && result.llm_individual_scores.length > 0 && (
          <div className="glass-card feedback-card">
            <h3>
              <span className="icon">🤖</span>
              <span className="tag-purple">Individual Model Scores</span>
            </h3>
            <div className="llm-scores-grid">
              {result.llm_individual_scores.map((score, i) => (
                <div key={i} className="llm-individual-card">
                  <div className="model-name">{MODEL_NAMES[i] || `Model ${i + 1}`}</div>
                  <div className="model-score">{score}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LLM Overviews */}
        {result.llm_overviews && result.llm_overviews.length > 0 && (
          <div className="feedback-section">
            <div className="glass-card feedback-card">
              <h3>
                <span className="icon">📋</span>
                <span className="tag-cyan">Reviewer Assessments</span>
              </h3>
              <div className="overview-list">
                {result.llm_overviews.map((overview, i) => (
                  <div key={i} className="overview-item">
                    <div className="reviewer-tag tag-purple">
                      {MODEL_NAMES[i] || `Reviewer ${i + 1}`}
                    </div>
                    <p>{overview}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LLM Improvements */}
        {result.llm_improvements && result.llm_improvements.length > 0 && (
          <div className="feedback-section">
            <div className="glass-card feedback-card">
              <h3>
                <span className="icon">🚀</span>
                <span className="tag-orange">Improvement Suggestions</span>
              </h3>
              <div className="overview-list">
                {result.llm_improvements.map((improvement, i) => (
                  <div key={i} className="overview-item">
                    <div className="reviewer-tag tag-orange">
                      {MODEL_NAMES[i] || `Reviewer ${i + 1}`}
                    </div>
                    <p>{improvement}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Unified Summary (from Indus) */}
        {result.llm_summary && (
          <div className="feedback-section">
            <div className="glass-card feedback-card">
              <h3>
                <span className="icon">✨</span>
                <span className="tag-pink">AI Summary (Indus 105B)</span>
              </h3>
              <p className="feedback-text">{result.llm_summary}</p>
            </div>
          </div>
        )}

        {/* Structure Feedback */}
        {result.structure_feedback && (
          <div className="feedback-section">
            <div className="glass-card feedback-card">
              <h3>
                <span className="icon">🎨</span>
                <span className="tag-cyan">Layout & Structure Feedback</span>
              </h3>
              <p className="feedback-text">{result.structure_feedback}</p>
            </div>
          </div>
        )}
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
          Upload your resume and job description to get an instant AI-powered
          score with detailed feedback from multiple models.
        </p>
      </header>

      <div className="glass-card">
        {/* PDF Upload */}
        <div
          className={`upload-zone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInput.current?.click()}
        >
          <input
            ref={fileInput}
            type="file"
            accept=".pdf"
            hidden
            onChange={(e) => setFile(e.target.files[0])}
          />
          {file ? (
            <>
              <div className="upload-icon"></div>
              <h3>File Selected</h3>
              <div className="file-name">📄 {file.name}</div>
            </>
          ) : (
            <>
              <div className="upload-icon">📄</div>
              <h3>Drop your resume PDF here</h3>
              <p>or click to browse files</p>
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
            onChange={(e) => setJd(e.target.value)}
          />
        </div>

        {/* JD Generator */}
        <div className="form-section jd-generator-section">
          <label className="field-label">🤖 Or generate a JD with AI</label>
          <div className="jd-gen-row">
            <div className="role-input-wrapper">
              <input
                type="text"
                list="role-suggestions"
                className="role-input"
                placeholder="Type or select a role…"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
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
                "✨ Generate JD"
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="form-section">
          <button
            className="submit-btn"
            disabled={!file || !jd.trim() || loading || generatingJd}
            onClick={handleSubmit}
          >
            {loading ? "Analyzing..." : "⚡ Analyze Resume"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <h3>Analyzing your resume...</h3>
            <p>Running 3 AI models + visual analysis. This may take 30-60 seconds.</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-card">
            <h3>❌ Analysis Failed</h3>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
