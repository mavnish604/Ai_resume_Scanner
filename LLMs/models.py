import os
from dotenv import load_dotenv
load_dotenv()

from langchain_groq import ChatGroq
from langchain_huggingface import ChatHuggingFace,HuggingFaceEndpoint
from .Sarvam_Wrapper import CustomSarvamChat

llm = HuggingFaceEndpoint(repo_id="deepseek-ai/DeepSeek-V3.2",task="text-generation",temperature=0.2)


lama70b = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.2
    )


gptOSS120b =ChatGroq(
    model="openai/gpt-oss-120b",
    temperature=0.2
    )


DeepseekR1 = ChatHuggingFace(llm=llm)

metaVLM = ChatGroq(
    model="meta-llama/llama-4-scout-17b-16e-instruct",
    temperature=0.2
    )


Indus = CustomSarvamChat(
    api_subscription_key=os.environ["SARVAM_API_KEY"], 
    model="sarvam-105b"
    )