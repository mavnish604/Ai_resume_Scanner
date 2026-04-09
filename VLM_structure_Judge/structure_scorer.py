from LLMs.models import metaVLM
from .image_to_base64 import pil_image_to_base64
from pdf2image import convert_from_path
from .visualSchema import ResumeEvalutionVLM
from langchain_core.messages import HumanMessage

model = metaVLM.with_structured_output(ResumeEvalutionVLM)


def evaluate_resume_layout(pdf_path: str) -> dict:
    # Convert first page of the PDF to a base64-encoded JPEG
    pages = convert_from_path(pdf_path, first_page=1, last_page=1)
    base64_image = pil_image_to_base64(pages[0])

    message = HumanMessage(
        content=[
            {
                "type": "text",
                "text": (
                    "You are an expert technical recruiter and resume layout judge. "
                    "Review the attached image of a resume. Do NOT evaluate the skills or experience. "
                    "Strictly evaluate the VISUAL STRUCTURE, FORMATTING, and READABILITY.\n\n"
                    "Return a JSON object with exactly two keys:\n"
                    "  - \"Score\": an integer from 0 to 100 (0 = extremely bad layout, 100 = excellent layout)\n"
                    "  - \"Feedback\": a string describing where the resume can be improved structure-wise"
                ),
            },
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"},
            },
        ]
    )

    result = model.invoke([message])
    return dict(result)


#                     Test 

#print(evaluate_resume_layout("Semantic_Scorer/Avnish_Mishra_April.pdf"))