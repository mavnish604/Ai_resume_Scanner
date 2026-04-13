from LLMs.models import DeepseekR1,lama70b,gptOSS120b,Indus
from .Structure_schema_LLM import Review
from langchain_core.prompts import PromptTemplate
import concurrent.futures

model1=lama70b.with_structured_output(Review)
model2=gptOSS120b.with_structured_output(Review)
model3=lama70b.with_structured_output(Review)


eval_prompt = PromptTemplate(
    input_variables=["job_description", "resume_text"],
    template="""
    You are an expert technical recruiter. Evaluate this resume against the job description.
    Provide a general overview, a strict score from 0-100, and areas for improvement.
    Use plain professional text only. Do not use emojis or decorative symbols.
    
    Job Description: {job_description}
    Resume: {resume_text}
    """
)


chain1 = eval_prompt | model1
chain2 = eval_prompt | model2
chain3 = eval_prompt | model3


chains = [chain1, chain2, chain3]


summary_prompt = PromptTemplate(
    input_variables=["overviews", "improvements"],
    template="""
    You are an expert recruiter assistant.

    Summarize the following reviewer feedback into:
    1. A concise unified overall resume assessment
    2. A concise unified improvement recommendation list
    Use plain professional text only. Do not use emojis or decorative symbols.

    Overviews:
    {overviews}

    Improvements:
    {improvements}
    """
)

summary_chain = summary_prompt | Indus




def run_ensemble_evaluation(resume_text: str, jd_text: str) -> dict:
    inputs = {"job_description": jd_text, "resume_text": resume_text}
    results = []

    with concurrent.futures.ThreadPoolExecutor() as executor:
        future_to_chain = {
            executor.submit(chain.invoke, inputs): chain
            for chain in chains
        }

        for future in concurrent.futures.as_completed(future_to_chain):
            try:
                results.append(future.result())
            except Exception as exc:
                print(f"Model failed: {exc}")

    if not results:
        return {"error": "All models failed."}

    average_score = round(sum(res.score for res in results) / len(results))

    list_of_overviews = [res.general_overview for res in results]
    list_of_improvements = [res.scope_of_improvement for res in results]

    # Summarize using Indus
    summary_result = summary_chain.invoke({
        "overviews": "\n".join(list_of_overviews),
        "improvements": "\n".join(list_of_improvements)
    })

    return {
        "final_average_score": average_score,
        "individual_scores": [res.score for res in results],

        "all_general_overviews": list_of_overviews,
        "all_improvements": list_of_improvements,

        "final_summary": summary_result.content
    }
