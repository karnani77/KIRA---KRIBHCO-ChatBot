import os
import glob
from dotenv import load_dotenv

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

# -----------------------------
# LOAD ENV
# -----------------------------
load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    print("❌ GOOGLE_API_KEY not found in .env")
    exit()

print("=" * 70)
print("🤖 KRIBHCO AI Knowledge Assistant")
print("=" * 70)

# -----------------------------
# LOAD PDFS
# -----------------------------
print("\n🔄 Scanning documents folder...")

pdf_files = glob.glob("documents/*.pdf")

if not pdf_files:
    print("❌ No PDF files found in documents folder")
    exit()

print(f"✅ Found {len(pdf_files)} PDFs")

docs = []

for pdf in pdf_files:
    try:
        loader = PyPDFLoader(pdf)
        pdf_docs = loader.load()
        docs.extend(pdf_docs)

        print(f"✅ Loaded: {os.path.basename(pdf)}")

    except Exception as e:
        print(f"❌ Failed: {pdf}")
        print(e)

print(f"\n✅ Total pages loaded: {len(docs)}")

# -----------------------------
# CHUNKING
# -----------------------------
print("\n🔄 Creating chunks...")

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)

chunks = splitter.split_documents(docs)

print(f"✅ Created {len(chunks)} chunks")

# -----------------------------
# EMBEDDINGS
# -----------------------------
print("\n🔄 Creating embeddings...")

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

print("✅ Embeddings ready")

# -----------------------------
# VECTOR STORE
# -----------------------------
print("\n🔄 Building FAISS database...")

vectorstore = FAISS.from_documents(
    chunks,
    embeddings
)

print("✅ FAISS ready")

retriever = vectorstore.as_retriever(
    search_kwargs={"k": 3}
)

# -----------------------------
# GEMINI
# -----------------------------
print("\n🔄 Initializing Gemini...")

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.2
)

print("✅ Gemini ready")

# -----------------------------
# PROMPT
# -----------------------------
template = """
You are KRIBHCO AI Assistant.

Answer ONLY using the provided context.

If the answer is not available in the documents, say:
"I could not find that information in the uploaded documents."

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

# -----------------------------
# FORMAT DOCS
# -----------------------------
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# -----------------------------
# RAG CHAIN
# -----------------------------
chain = (
    {
        "context": retriever | format_docs,
        "question": RunnablePassthrough()
    }
    | prompt
    | llm
    | StrOutputParser()
)

# -----------------------------
# CHAT LOOP
# -----------------------------
print("\n" + "=" * 70)
print("✨ KRIBHCO Assistant Ready")
print("=" * 70)

print("\nType 'exit' to quit\n")

while True:

    question = input("You: ")

    if question.lower() == "exit":
        break

    try:

        answer = chain.invoke(question)

        print("\n🤖 Assistant:")
        print(answer)

        print("\n📄 Sources:")

        source_docs = retriever.invoke(question)

        for i, doc in enumerate(source_docs, start=1):
            source = os.path.basename(
                doc.metadata.get("source", "Unknown")
            )

            page = doc.metadata.get("page", "?")

            print(f"   [{i}] {source} (Page {page + 1})")

        print()

    except Exception as e:
        print("\n❌ Error:")
        print(e)