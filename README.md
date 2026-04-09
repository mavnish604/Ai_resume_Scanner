# AI Resume Scanner

AI Resume Scanner is a full-stack ATS-style resume analysis project that scores a PDF resume against a job description using three complementary signals:

- semantic similarity between the resume text and the JD
- visual layout and readability analysis of the resume
- multi-model LLM review with consolidated feedback

The repository includes a FastAPI backend, a Next.js frontend, and Mermaid diagrams that document the system design.

## What This Repo Does

Given a resume PDF and a job description, the app:

1. extracts text from the resume
2. computes a semantic relevance score
3. evaluates resume layout from the first page image
4. runs an ensemble of LLM reviewers on the resume/JD pair
5. combines the results into a final weighted ATS score

Current score weighting in the backend:

- `70%` LLM ensemble score
- `20%` visual structure score
- `10%` semantic similarity score

## Main Features

- Upload a PDF resume and evaluate it against any job description
- Generate a synthetic job description from a role prompt using DuckDuckGo + Hugging Face
- View the final ATS score plus sub-scores for semantic, structure, and LLM review
- Inspect per-model reviewer feedback and a unified AI summary
- Review architecture diagrams directly from the repo

## Tech Stack

### Backend

- FastAPI
- LangChain
- Groq-hosted models
- Hugging Face Inference API
- Sarvam API
- Sentence Transformers
- `pdf2image`
- `PyPDFLoader`

### Frontend

- Next.js
- React
- ESLint

## Repository Layout

```text
Ai_resume_Scanner/
├── api/                      FastAPI app and routes
├── LLMs/                     model clients and JD generation logic
├── LLM_Judge/                multi-model review and summary pipeline
├── Semantic_Scorer/          text extraction and semantic scoring
├── VLM_structure_Judge/      visual layout scoring from resume page image
├── frontend/                 Next.js UI
├── *.mermaid                 architecture and flow diagrams
├── requirements.txt          backend Python dependencies
└── setup.py                  package metadata
```

## Architecture Summary

- `api/main.py` exposes the HTTP endpoints used by the frontend.
- `Semantic_Scorer/` extracts resume text and computes cosine similarity with `all-MiniLM-L6-v2`.
- `VLM_structure_Judge/` converts the first PDF page to an image and asks a vision-capable LLM to score formatting and readability.
- `LLM_Judge/` runs multiple structured LLM reviews in parallel and summarizes the combined feedback.
- `LLMs/jd_generator.py` searches recent job-posting snippets and synthesizes a realistic JD for the chosen role.

## Included Diagrams

- `activity_diagram.mermaid`
- `class_diagram.mermaid`
- `dfd_level_0.mermaid`
- `dfd_level_1.mermaid`
- `dfd_level_2.mermaid`

## Prerequisites

- Python `3.12+`
- Node.js `20+`
- npm
- Poppler utilities installed locally for `pdf2image`

Make sure `pdftoppm` is available on your system, since `pdf2image` depends on it.

## Environment Variables

Create a local `.env` file from `.env.example` and provide the API keys below:

```bash
GROQ_API_KEY=...
HUGGINGFACEHUB_API_TOKEN=...
SARVAM_API_KEY=...
```

Notes:

- Groq is used for the LLM ensemble and the visual layout model.
- Hugging Face is used for synthetic JD generation.
- Sarvam is used to summarize the ensemble reviewers.

## Backend Setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload
```

The backend runs at `http://localhost:8000`.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:3000`.

The current frontend is hardcoded to call the backend at `http://localhost:8000`, and the backend CORS configuration currently allows `http://localhost:3000`.

## API Endpoints

### `POST /generate-jd`

Generate a synthetic job description from a role name.

Form fields:

- `role`

### `POST /semantic-score`

Return the semantic similarity score between the uploaded resume and JD.

Form fields:

- `pdf_file`
- `job_description`

### `POST /evalute-structures`

Return the structure/layout score for the uploaded resume.

Form fields:

- `pdf_file`

### `POST /generate-ATS`

Run the ensemble LLM review and return model-level feedback.

Form fields:

- `pdf_file`
- `job_description`

### `POST /final-score`

Run all scorers in parallel and return the combined ATS result.

Form fields:

- `pdf_file`
- `job_description`

## Example Request

```bash
curl -X POST http://localhost:8000/final-score \
  -F "pdf_file=@Semantic_Scorer/Avnish_Mishra_April.pdf" \
  -F "job_description=Backend engineer with Python, APIs, and cloud experience"
```

## Notes and Limitations

- Only PDF resumes are currently supported.
- The scoring pipeline depends on external model providers and internet-backed APIs.
- The structure scorer evaluates the first page only.
- The route name `/evalute-structures` is spelled that way in the current backend and README to match the code.

## Future Improvements

- Add backend tests and API contract checks
- Externalize API base URLs into environment variables
- Add authentication and rate limiting
- Add deployment instructions for the frontend and backend
- Introduce a single reproducible backend package configuration
