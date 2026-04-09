from langchain_community.document_loaders import PyPDFLoader


def get_text(path:str)->list:
    docs:list = PyPDFLoader(path).load()
    return docs


def combined_text(path:str)->str:
    l:list = get_text(path)
    text =""
    for i in l:
        text+=i.page_content

    return text


# test
#print(combined_text("Semantic_Scorer/GL2_1000020153_EDS_EVEN2026_Avnish_Mishra.pdf"))
