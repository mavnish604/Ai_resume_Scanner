from sentence_transformers import SentenceTransformer, util
import torch

model:SentenceTransformer = SentenceTransformer("all-MiniLM-L6-v2")

def cal_semantic_score(role:str,desc:str)->float:
    emb1:torch.Tensor=model.encode(role)
    emb2:torch.Tensor=model.encode(desc)

    return util.cos_sim(emb1,emb2).item()


#------------------test-----------------------
# print(cal_semantic_score("king","queen"))