import PyPDF2
import sys

pdf_path = sys.argv[1] if len(sys.argv) > 1 else "Plaint_Civil_Suit-report.pdf"

try:
    reader = PyPDF2.PdfReader(pdf_path)
    print(f"Pages: {len(reader.pages)}")
    
    text = reader.pages[0].extract_text()
    print(f"Page 1 text length: {len(text)}")
    
    if text.strip():
        print(f"First 200 chars:\n{text[:200]}")
    else:
        print("NO TEXT FOUND - This is likely a scanned/image-based PDF")
except Exception as e:
    print(f"Error: {e}")
