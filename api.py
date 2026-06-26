
import os
import glob

from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time

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
    temperature=0
)

# -------------------------
# PROMPT
# -------------------------

template = """
You are KIRA (KRIBHCO Intelligent Retrieval Assistant).

Rules:

1. Answer ONLY using the provided context.

2. If the user greets you, respond naturally and professionally.

3. Keep answers concise and professional.
   - Maximum 150 words unless more detail is requested.
   - Use bullet points only when they improve readability.

4. If the question is about a system, include (if available):
   • Purpose
   • Key Features
   • Modules

5. Never invent information.
   If the answer is not found in the documents, reply exactly:
   "I could not find that information in the uploaded documents."

6. ALWAYS generate EXACTLY TWO relevant follow-up questions.

7. The follow-up questions must:
   • Be directly related to the answer.
   • Be complete questions.
   • Encourage the user to explore the topic further.
   • Never use placeholders like "Question 1".

8. End EVERY answer using exactly this format:

Follow-up Questions:
• <Question 1>
• <Question 2>

Reply:
Yes, I'd be happy to explain either of these further.

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
    return "\n\n".join(
        doc.page_content[:800]
        for doc in docs
    )

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

        question = data.question.lower().strip()

        if question in [
            "hi",
            "hello",
            "hey",
            "good morning",
            "good afternoon",
            "good evening"
        ]:

            return {
                "answer": "Hello! I'm KIRA, your KRIBHCO Intelligent Retrieval Assistant. How can I help you today?",
                "sources": []
            }

        t1 = time.time()

        source_docs = retriever.invoke(data.question)

        print(f"🔍 Retrieval: {time.time() - t1:.2f} sec")

        t2 = time.time()

        answer = chain.invoke(data.question)

        print(f"🤖 Chain: {time.time() - t2:.2f} sec")

        print(f"⏱ Total: {time.time() - t1:.2f} sec")

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

        print(e)

        return {
            "answer": "Something went wrong.",
            "sources": []
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