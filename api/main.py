import os
import tempfile
import concurrent.futures
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from Semantic_Scorer.extract_text import combined_text
from Semantic_Scorer.generate_semantic_score import gen_sem_score
from LLM_Judge.LLM_Scorer import run_ensemble_evaluation
from VLM_structure_Judge.structure_scorer import evaluate_resume_layout
from LLMs.jd_generator import generate_synthetic_jd

app = FastAPI(title="ATS Resume Scanner")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Helper: save uploaded PDF to a temp file ───────────────────────────
async def _save_upload(pdf_file: UploadFile) -> str:
    if not pdf_file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await pdf_file.read())
        return tmp.name


# ─── POST /generate-ATS ─────────────────────────────────────────────────
@app.post("/generate-ATS")
async def getLLMScore(
    pdf_file: UploadFile = File(...),
    job_description: str = Form(...)
):
    """Ensemble LLM scoring: 3-model average with summary."""
    tmp_path = None
    try:
        tmp_path = await _save_upload(pdf_file)
        resume_text = combined_text(tmp_path)

        result = run_ensemble_evaluation(
            resume_text=resume_text,
            jd_text=job_description
        )
        if result is None or "error" in result:
            raise HTTPException(status_code=500, detail="LLM scoring models failed.")
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


# ─── POST /evalute-structures ────────────────────────────────────────────
@app.post("/evalute-structures")
async def eval_struc(
    pdf_file: UploadFile = File(...)
):
    """VLM-based visual structure and layout scoring."""
    tmp_path = None
    try:
        tmp_path = await _save_upload(pdf_file)
        result = evaluate_resume_layout(tmp_path)
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


# ─── POST /semantic-score ───────────────────────────────────────────────
@app.post("/semantic-score")
async def getSemanticScore(
    pdf_file: UploadFile = File(...),
    job_description: str = Form(...)
):
    """Semantic cosine-similarity scoring (0-100)."""
    tmp_path = None
    try:
        tmp_path = await _save_upload(pdf_file)
        score = gen_sem_score(resume_path=tmp_path, role=job_description)
        return {"semantic_score": round(score * 100, 2)}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


# ─── POST /generate-jd ──────────────────────────────────────────────────
@app.post("/generate-jd")
async def generateJd(role: str = Form(...)):
    """Generate a synthetic job description for any role using web search + AI."""
    if not role.strip():
        raise HTTPException(status_code=400, detail="Role cannot be empty.")
    try:
        jd = generate_synthetic_jd(role.strip())
        return {"job_description": jd}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JD generation failed: {str(e)}")


# ─── POST /final-score ──────────────────────────────────────────────────
@app.post("/final-score")
async def getFinalScore(
    pdf_file: UploadFile = File(...),
    job_description: str = Form(...)
):
    """
    Runs all three scorers concurrently and returns a weighted final score:
    70% LLM ensemble + 20% structure + 10% semantic.
    """
    tmp_path = None
    try:
        tmp_path = await _save_upload(pdf_file)
        resume_text = combined_text(tmp_path)

        # Run all three scorers in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            sem_future = executor.submit(gen_sem_score, resume_path=tmp_path, role=job_description)
            struct_future = executor.submit(evaluate_resume_layout, tmp_path)
            llm_future = executor.submit(
                run_ensemble_evaluation, resume_text=resume_text, jd_text=job_description
            )

        semantic_raw = sem_future.result()
        semantic_score = round(semantic_raw * 100, 2)
        structure_result = struct_future.result()
        llm_result = llm_future.result()

        structure_score = structure_result.get("Score", 0)
        llm_avg_score = llm_result.get("final_average_score", 0)

        # Weighted combination: 70% LLM + 20% structure + 10% semantic
        final_score = round(
            0.10 * semantic_score + 0.20 * structure_score + 0.70 * llm_avg_score, 2
        )

        return {
            "final_score": final_score,
            "semantic_score": semantic_score,
            "structure_score": structure_score,
            "structure_feedback": structure_result.get("Feedback", ""),
            "llm_avg_score": llm_avg_score,
            "llm_individual_scores": llm_result.get("individual_scores", []),
            "llm_overviews": llm_result.get("all_general_overviews", []),
            "llm_improvements": llm_result.get("all_improvements", []),
            "llm_summary": llm_result.get("final_summary", ""),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)