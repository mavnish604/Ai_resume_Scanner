from pydantic import BaseModel, Field

class Review(BaseModel):
    general_overview: str = Field(
        ..., 
        description="Write a brief text comparing the candidate's resume to the job description."
    )
    score: int = Field(
        ..., 
        description="Give a score from 0 to 100 based on the relevance of the resume to the job description. 100 means 'definitely hire', and 0 means 'do not hire'.", 
        ge=0, 
        le=100
    )
    scope_of_improvement: str = Field(
        ..., 
        description="Give a short description of where the candidate's resume can be improved to better match the role."
    )