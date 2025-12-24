from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PyPDF2 import PdfReader
import os
import shutil
import tempfile

app = FastAPI()

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],  # adjust as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/upload-document")
async def upload_document(file: UploadFile = File(...)):
    # Only allow PDF for this example
    if not file.filename.lower().endswith('.pdf'):
        return {"error": "Only PDF files are supported."}

    # Save file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    # Extract text
    try:
        reader = PdfReader(tmp_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        os.remove(tmp_path)
        if not text.strip():
            return {"error": "No text found in PDF."}
        # You can store or process the text here as needed
        return {"text": text, "message": "Document processed successfully!"}
    except Exception as e:
        os.remove(tmp_path)
        return {"error": f"Failed to process PDF: {str(e)}"}

# To run: uvicorn pdf_to_text_api:app --reload