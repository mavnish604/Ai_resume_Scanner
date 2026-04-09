from pydantic import BaseModel,Field

class ResumeEvalutionVLM(BaseModel):
    Score:int=Field(...,description="Based on the resume provided in the image judge it on the basis on Structure score it out of 100, 0 being extremely bad layout and 100 begin a good layout",ge=0,le=100)
    Feedback:str=Field(...,description="write where do you think the resume can be improved structure wise")