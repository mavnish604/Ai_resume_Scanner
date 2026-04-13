"""
Synthetic Job Description Generator
Uses DuckDuckGo web search + HuggingFace model to create realistic JDs.
"""

import os
from dotenv import load_dotenv
load_dotenv()

from duckduckgo_search import DDGS
from huggingface_hub import InferenceClient

HF_MODEL = "Qwen/Qwen2.5-72B-Instruct"

_client = InferenceClient(
    model=HF_MODEL,
    token=os.environ.get("HUGGINGFACEHUB_API_TOKEN"),
)


def _search_job_postings(role: str, max_results: int = 5) -> str:
    """Search the web for recent job postings for the given role."""
    query = f"{role} job description requirements responsibilities 2025"
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
        if not results:
            return "No web results found."
        snippets = []
        for i, r in enumerate(results, 1):
            snippets.append(f"[{i}] {r.get('title', '')}\n{r.get('body', '')}")
        return "\n\n".join(snippets)
    except Exception as e:
        return f"Web search failed: {str(e)}"


def generate_synthetic_jd(role: str) -> str:
    """
    Generate a synthetic job description for the given role by:
    1. Searching the web for real job postings
    2. Feeding those results as context to a HuggingFace LLM to synthesize a comprehensive JD
    """
    web_context = _search_job_postings(role)

    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert technical recruiter. Given web search results about "
                "real job postings, synthesize a single comprehensive, realistic job "
                "description. Include: Job Title, Company Overview (make up a realistic "
                "tech company), Responsibilities, Required Qualifications, Preferred "
                "Qualifications, and Benefits. Make it professional and detailed. "
                "Do NOT mention that you used web search. Do not use emojis or decorative symbols. "
                "Write it as if it is a real "
                "job posting."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Create a detailed job description for the role: **{role}**\n\n"
                f"Here are some real-world job posting snippets for reference:\n\n"
                f"{web_context}\n\n"
                f"Now write a single, comprehensive job description for this role."
            ),
        },
    ]

    response = _client.chat_completion(messages=messages, max_tokens=2048, temperature=0.3)
    return response.choices[0].message.content
