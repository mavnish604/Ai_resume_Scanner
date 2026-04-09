from .compare_cos_similarity import cal_semantic_score
from .extract_text import combined_text
from .extract_text import get_text
from langchain_core.tools import StructuredTool
from typing import Type
from pydantic import BaseModel,Field


class Score(BaseModel):
    role:str = Field(...,description="Job description for which Application has to be shortlisted against")
    resume_path:str = Field(...,description="Path to the resume which has to be evalutated")


def gen_sem_score(resume_path:str,role:str)->float:

    """Internally calls get_text fn to get a list of 
        text of pages then combines text on all pages
        as string then uses sematic scoring to generate a score
        against the job role
    """

    return cal_semantic_score(combined_text(resume_path),role)


Semantic_Score_Tool = StructuredTool.from_function(
    func=gen_sem_score,
    name="gen_sem_score",
    description="""Internally calls get_text fn to get a list of 
        text of pages then combines text on all pages
        as string then uses sematic scoring to generate a score
        against the job role
    """,
    args_schema=Score
)




# #         test
# FUNCTION TEST 
# if __name__ == "__main__":
  
#     role:str = '''Here is a synthetic job description for an AI Engineer, styled as a typical posting you might find on a tech job board.
#     Job Title: Artificial Intelligence Engineer

#     Company: NexaCore Innovations
#     Location: Remote / Hybrid
#     Job Type: Full-Time
#     About NexaCore Innovations

#     NexaCore is a forward-thinking technology company dedicated to building intelligent solutions that transform how users interact with digital media and data. We are looking for a passionate AI Engineer to join our core intelligence team to help build the next generation of predictive algorithms and interactive systems.
#     The Role

#     As an Artificial Intelligence Engineer, you will design, develop, and deploy machine learning models that drive our core products. You will work closely with software developers and data scientists to transition experimental models into robust, production-ready applications. Your work will directly impact how our systems process information, understand user sentiment, and predict future trends.
#     Key Responsibilities

#         Recommendation Engines: Architect and refine intelligent recommendation systems that analyze user preferences to deliver highly targeted content and suggestions.

#         Predictive Modeling: Develop and train predictive models capable of analyzing historical datasets to forecast future outcomes and scores with high accuracy.

#         Sentiment & Audio Analysis: Implement natural language processing and audio sentiment analysis pipelines to extract meaningful insights from unstructured multimedia data.

#         Model Deployment: Translate machine learning algorithms into optimized, scalable code for deployment in cloud environments.

#         Cross-Functional Collaboration: Collaborate with product managers and backend engineering teams to integrate AI features seamlessly into user-facing applications.

#     Qualifications & Skills

#         Education: Bachelor’s or Master’s degree in Computer Science, Data Science, Artificial Intelligence, or a related field.

#         Core Languages: Strong programming proficiency in Python and C++.

#         Secondary Languages: Familiarity with Java or R programming for data manipulation and enterprise integration is highly preferred.

#         Machine Learning Foundation: Deep understanding of core machine learning principles, algorithms, and data structures.

#         Libraries & Frameworks: Experience with industry-standard ML libraries (e.g., TensorFlow, PyTorch, Scikit-learn, Pandas).

#         Software Engineering Best Practices: Experience with version control (Git), writing clean code, and understanding of the software development life cycle.

#     Bonus Points

#         A strong portfolio of personal or academic projects showcasing applied machine learning (e.g., predictive analytics, specialized NLP projects, or custom AI tools).

#         Experience in student leadership or technical community management.

#     What We Offer

#         Competitive salary and equity packages.

#         Flexible working hours and remote-first culture.

#         Dedicated budget for continuous learning, certifications, and attending technical conferences.

#         Opportunity to work on cutting-edge projects from ideation to launch.'''


#     print(gen_sem_score("Semantic_Scorer/Avnish_Mishra_April.pdf", role))



#     TOOL TEST


# if __name__ == "__main__":
  
#     role:str = '''Here is a synthetic job description for an AI Engineer, styled as a typical posting you might find on a tech job board.
#     Job Title: Artificial Intelligence Engineer

#     Company: NexaCore Innovations
#     Location: Remote / Hybrid
#     Job Type: Full-Time
#     About NexaCore Innovations

#     NexaCore is a forward-thinking technology company dedicated to building intelligent solutions that transform how users interact with digital media and data. We are looking for a passionate AI Engineer to join our core intelligence team to help build the next generation of predictive algorithms and interactive systems.
#     The Role

#     As an Artificial Intelligence Engineer, you will design, develop, and deploy machine learning models that drive our core products. You will work closely with software developers and data scientists to transition experimental models into robust, production-ready applications. Your work will directly impact how our systems process information, understand user sentiment, and predict future trends.
#     Key Responsibilities

#         Recommendation Engines: Architect and refine intelligent recommendation systems that analyze user preferences to deliver highly targeted content and suggestions.

#         Predictive Modeling: Develop and train predictive models capable of analyzing historical datasets to forecast future outcomes and scores with high accuracy.

#         Sentiment & Audio Analysis: Implement natural language processing and audio sentiment analysis pipelines to extract meaningful insights from unstructured multimedia data.

#         Model Deployment: Translate machine learning algorithms into optimized, scalable code for deployment in cloud environments.

#         Cross-Functional Collaboration: Collaborate with product managers and backend engineering teams to integrate AI features seamlessly into user-facing applications.

#     Qualifications & Skills

#         Education: Bachelor’s or Master’s degree in Computer Science, Data Science, Artificial Intelligence, or a related field.

#         Core Languages: Strong programming proficiency in Python and C++.

#         Secondary Languages: Familiarity with Java or R programming for data manipulation and enterprise integration is highly preferred.

#         Machine Learning Foundation: Deep understanding of core machine learning principles, algorithms, and data structures.

#         Libraries & Frameworks: Experience with industry-standard ML libraries (e.g., TensorFlow, PyTorch, Scikit-learn, Pandas).

#         Software Engineering Best Practices: Experience with version control (Git), writing clean code, and understanding of the software development life cycle.

#     Bonus Points

#         A strong portfolio of personal or academic projects showcasing applied machine learning (e.g., predictive analytics, specialized NLP projects, or custom AI tools).

#         Experience in student leadership or technical community management.

#     What We Offer

#         Competitive salary and equity packages.

#         Flexible working hours and remote-first culture.

#         Dedicated budget for continuous learning, certifications, and attending technical conferences.

#         Opportunity to work on cutting-edge projects from ideation to launch.'''
    

#     result=Semantic_Score_Tool.invoke({"resume_path":"Semantic_Scorer/Avnish_Mishra_April.pdf","role":role})

#     print(result)
#     print(Semantic_Score_Tool.name)
#     print(Semantic_Score_Tool.description)
#     print(Semantic_Score_Tool.args)  