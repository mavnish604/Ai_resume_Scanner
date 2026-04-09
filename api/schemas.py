from pydantic import BaseModel, Field


class SemanticScoringRequest(BaseModel):
    job_description: str = Field(
        ...,
        description="The full text of the job description to evaluate against."
    )