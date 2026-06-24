
import os
import glob

from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

import os

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

# -------------------------
# FASTAPI
# -------------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Question(BaseModel):
    question: str

# -------------------------
# LOAD ENV
# -------------------------

load_dotenv()

print("🚀 Loading KRIBHCO AI Backend...")

# -------------------------
# LOAD PDFS
# -------------------------

pdf_files = glob.glob(
    "documents/**/*.pdf",
    recursive=True
)

print("\n📄 PDFs Found:\n")

for pdf in pdf_files:
    print(pdf)

print("\n📄 PDFs Found:")

for pdf in pdf_files:
    print(pdf)

docs = []

for pdf in pdf_files:
    loader = PyPDFLoader(pdf)
    docs.extend(loader.load())

# -------------------------
# CHUNKING
# -------------------------

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50
)
chunks = splitter.split_documents(docs)

# -------------------------
# EMBEDDINGS
# -------------------------

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={
        "device": "cpu"
    },
    encode_kwargs={
        "normalize_embeddings": False
    }
)

# -------------------------
# FAISS
# -------------------------

vectorstore = FAISS.from_documents(
    chunks,
    embeddings
)

retriever = vectorstore.as_retriever(
    search_kwargs={"k": 1}
)

# -------------------------
# GEMINI
# -------------------------

llm = ChatOllama(
    model="llama3.2:3b",
    temperature=0.2
)

# -------------------------
# PROMPT
# -------------------------

template = """
You are KIRA (KRIBHCO Intelligent Retrieval Assistant).

Rules:

1. If the user greets you (hello, hi, hey, good morning, good afternoon),
   respond naturally and professionally.

2. If the user asks about KRIBHCO systems, documents, modules, workflows,
   reports, or processes, answer ONLY using the provided context.

3. Give detailed and professional answers.

4. Use bullet points where appropriate.

5. If asked about a system, explain:
   - Purpose
   - Key Features
   - Modules (if available)

6. Do not make up information.

7. If the answer is not available in the documents, respond:
   "I could not find that information in the uploaded documents."

8. After answering, suggest 2-3 relevant follow-up questions.

Format:

Follow-up Questions:
• Question 1
• Question 2
• Question 3

Reply Yes if you would like me to explain any of these further.

Context:
{context}

Question:
{question}

Answer:
"""

prompt = PromptTemplate(
    template=template,
    input_variables=["context", "question"]
)

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

chain = (
    {
        "context": retriever | format_docs,
        "question": RunnablePassthrough()
    }
    | prompt
    | llm
    | StrOutputParser()
)

print("✅ KRIBHCO AI Ready")

# -------------------------
# API ROUTES
# -------------------------

@app.get("/")
def root():
    return {"status": "running"}

@app.post("/chat")
def chat(data: Question):

    try:
        import time

        start = time.time()

        answer = chain.invoke(data.question)

        print(f"⏱ Total chain time: {time.time() - start:.2f} sec")

        source_docs = retriever.invoke(data.question)

        sources = []

        for doc in source_docs:

            source = os.path.basename(
                doc.metadata.get("source", "Unknown")
            )

            page = doc.metadata.get("page", 0) + 1

            sources.append(
                f"{source} (Page {page})"
            )

        return {
            "answer": answer,
            "sources": sources
        }

    except Exception as e:

        if "RESOURCE_EXHAUSTED" in str(e):

            return {
                "answer": "⚠️ Gemini API limit reached. Please try again in a minute.",
                "sources": []
            }

        return {
    "answer": str(e),
    "sources":[]
}