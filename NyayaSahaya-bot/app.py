from fastapi import FastAPI, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import requests
import os
from dotenv import load_dotenv
import re
import PyPDF2
import io
import json
try:
    from pdf2image import convert_from_bytes
    import pytesseract
    from PIL import Image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("[WARNING] OCR not available. Install: pip install pdf2image pytesseract Pillow")

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# LLM Configuration - supports both Ollama (local) and Groq (cloud)
USE_GROQ = os.getenv("USE_GROQ", "false").lower() == "true"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

if USE_GROQ and GROQ_API_KEY:
    try:
        from groq import Groq
        groq_client = Groq(api_key=GROQ_API_KEY)
        print(f"[*] Starting NyayaSahaya API")
        print(f"[GROQ] Using Groq Cloud (FAST mode)")
        print(f"[GROQ] Model: llama-3.1-8b-instant")
    except ImportError:
        print("[WARNING] Groq not installed, falling back to Ollama")
        print("Run: pip install groq")
        USE_GROQ = False
        print(f"[*] Starting NyayaSahaya API")
        print(f"[OLLAMA] Ollama URL: {OLLAMA_URL}")
        print(f"[OLLAMA] Ollama Model: {OLLAMA_MODEL}")
else:
    print(f"[*] Starting NyayaSahaya API")
    print(f"[OLLAMA] Ollama URL: {OLLAMA_URL}")
    print(f"[OLLAMA] Ollama Model: {OLLAMA_MODEL}")

# In-memory conversation history
conversations = {}

def extract_json_from_response(text):
    """Extract JSON from markdown code blocks or raw text"""
    if isinstance(text, dict):
        return text
    if isinstance(text, list):
        return text
    
    text = str(text).strip()
    
    # Try direct JSON parse first
    try:
        return json.loads(text)
    except:
        pass
    
    # Extract from markdown code blocks
    patterns = [
        r'```json\s*(\{.*?\}|\[.*?\])\s*```',
        r'```\s*(\{.*?\}|\[.*?\])\s*```',
        r'(\{[^{}]*"[^"]*"[^{}]*:.*?\})',
        r'(\[[^\[\]]*\{.*?\}[^\[\]]*\])'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except:
                continue
    
    return None


def get_default_responses():
    """Fallback responses when parsing fails"""
    return {
        "analysis": {
            "case_type": "Civil",
            "jurisdiction": "District Court",
            "sections": ["Contract Act 1872"],
            "complexity_score": 60,
            "parties": {
                "petitioner": "Complainant",
                "respondent": "Defendant"
            },
            "key_facts": ["Contract dispute", "Payment default"],
            "legal_issues": ["Breach of contract", "Recovery of amount"]
        },
        "risk": {
            "legal_penalty_probability": 60,
            "financial_risk": 70,
            "urgency_level": 75,
            "overall_risk": "Medium",
            "risk_explanation": "Moderate risk based on available information"
        },
        "strength": {
            "strength_score": 65,
            "strengths": ["Written agreement exists", "Clear breach of terms"],
            "weaknesses": ["Missing evidence", "Incomplete documentation"],
            "missing_evidence": ["Payment receipts", "Correspondence"],
            "win_probability": 60,
            "recommendations": ["Gather more evidence", "Consult lawyer"]
        },
        "precedents": [
            {
                "title": "Similar Contract Dispute",
                "citation": "2023 SCC 123",
                "similarity": 70,
                "verdict": "Favor of complainant",
                "reasoning": "Contract breach established",
                "relevance": "Similar circumstances",
                "keyTakeaway": "Written agreements are enforceable"
            }
        ],
        "timeline": [
            {
                "stage": "Filing",
                "date": "2024-01-15",
                "status": "Pending",
                "description": "Case filing and registration",
                "expected_duration": "1-2 weeks"
            },
            {
                "stage": "First Hearing",
                "date": "2024-02-15",
                "status": "Upcoming",
                "description": "Initial hearing",
                "expected_duration": "1 day"
            }
        ]
    }


def call_llm(prompt, system_prompt=None, conversation_id="default", expect_json=False):
    """Universal LLM caller - uses Groq if enabled, otherwise Ollama"""
    if USE_GROQ and GROQ_API_KEY:
        return call_groq(prompt, system_prompt, conversation_id, expect_json)
    else:
        return call_ollama(prompt, system_prompt, conversation_id, expect_json)


def call_groq(prompt, system_prompt=None, conversation_id="default", expect_json=False):
    """Call Groq API - SUPER FAST cloud inference"""
    if conversation_id not in conversations:
        conversations[conversation_id] = []
    
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    
    if not expect_json:
        messages.extend(conversations[conversation_id])
    
    messages.append({"role": "user", "content": prompt})
    
    print(f"\n[DEBUG] Calling Groq Cloud...")
    print(f"[DEBUG] Model: llama-3.1-8b-instant")
    print(f"[DEBUG] Prompt length: {len(prompt)} chars")
    
    try:
        # Build request params - DON'T use response_format as it breaks analysis
        request_params = {
            "model": "llama-3.1-8b-instant",
            "messages": messages,
            "temperature": 0.3 if expect_json else 0.7,
            "max_tokens": 1024,  # Increased for better responses
            "top_p": 0.9
        }
        
        # NOTE: response_format json_object causes Groq to return null/empty values
        # Better to let it respond naturally and parse JSON from the response
        
        response = groq_client.chat.completions.create(**request_params)
        
        assistant_message = response.choices[0].message.content
        print(f"[DEBUG] Groq response: {len(assistant_message)} chars")
        print(f"[DEBUG] Response preview: {assistant_message[:300]}...")  # Show first 300 chars
        
        if not expect_json:
            conversations[conversation_id].append({"role": "user", "content": prompt})
            conversations[conversation_id].append({"role": "assistant", "content": assistant_message})
            
            if len(conversations[conversation_id]) > 2:
                conversations[conversation_id] = conversations[conversation_id][-2:]
        
        if expect_json:
            parsed = extract_json_from_response(assistant_message)
            if parsed:
                return parsed
        
        return assistant_message
        
    except Exception as e:
        print(f"[DEBUG] ERROR - Groq error: {e}")
        print(f"[DEBUG] Falling back to Ollama...")
        return call_ollama(prompt, system_prompt, conversation_id, expect_json)


def call_ollama(prompt, system_prompt=None, conversation_id="default", expect_json=False):
    """Call Ollama API with optimized settings for long documents"""
    
    if conversation_id not in conversations:
        conversations[conversation_id] = []
    
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    
    if not expect_json:
        messages.extend(conversations[conversation_id])
    
    messages.append({"role": "user", "content": prompt})
    
    print(f"\n[DEBUG] Calling Ollama...")
    print(f"[DEBUG] Model: {OLLAMA_MODEL}")
    print(f"[DEBUG] Expect JSON: {expect_json}")
    print(f"[DEBUG] Prompt length: {len(prompt)} chars")
    
    try:
        payload = {
            "model": OLLAMA_MODEL,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": 0.3 if expect_json else 0.7,
                "num_predict": 256,       # Fast responses for demo
                "num_ctx": 2048,          # Reduced context for speed
                "top_p": 0.9,
                "repeat_penalty": 1.1
            }
        }
        # Don't use format: json as mistral doesn't support it well
        # if expect_json:
        #     payload["format"] = "json"
        
        response = requests.post(
            f"{OLLAMA_URL}/api/chat",
            json=payload,
            timeout=300  # 5 minutes timeout
        )
        
        print(f"[DEBUG] ✅ Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            assistant_message = result["message"]["content"]
            
            print(f"[DEBUG] 📨 Response length: {len(assistant_message)} chars")
            print(f"[DEBUG] 📨 Response preview: {assistant_message[:150]}...")
            
            if not expect_json:
                conversations[conversation_id].append({"role": "user", "content": prompt})
                conversations[conversation_id].append({"role": "assistant", "content": assistant_message})
                
                if len(conversations[conversation_id]) > 2:
                    conversations[conversation_id] = conversations[conversation_id][-2:]
            
            if expect_json:
                parsed = extract_json_from_response(assistant_message)
                if parsed:
                    print(f"[DEBUG] ✅ JSON parsed successfully")
                    return parsed
                print(f"[DEBUG] ⚠️ JSON parse failed, returning raw")
                return assistant_message
            
            return assistant_message
        else:
            print(f"[DEBUG] ❌ Ollama error status: {response.status_code}")
            return None
            
    except requests.exceptions.Timeout:
        print("[DEBUG] ❌ Request timed out - document might be too long or model too slow")
        return None
    except requests.exceptions.ConnectionError:
        print("[DEBUG] ❌ Cannot connect to Ollama - is 'ollama serve' running?")
        return None
    except Exception as e:
        print(f"[DEBUG] ❌ Exception: {e}")
        return None


# Legal prompt template
LEGAL_SYSTEM_PROMPT = """You are NyayaSahaya, an AI legal assistant specializing in Indian law. Be accurate, concise, and helpful."""


@app.post("/api/chat")
async def chat(request: Request):
    """Chat endpoint"""
    try:
        data = await request.json()
        question = data.get("question", "").strip()
        session_id = data.get("session_id", "default")
        
        print(f"\n[CHAT] Question: {question[:100]}...")
        
        if not question:
            return JSONResponse({"error": "Question is required"}, status_code=400)

        answer = call_llm(question, LEGAL_SYSTEM_PROMPT, session_id, expect_json=False)
        
        if not answer:
            return {"answer": "I'm having trouble connecting. Please ensure Ollama is running with 'ollama serve'."}
            
        return {"answer": answer}
        
    except Exception as e:
        print(f"[ERROR] chat: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)


# Enhanced prompts for more detailed legal analysis

@app.post("/api/analyze-case")
async def analyze_case(request: Request):
    """Comprehensive legal document analysis"""
    try:
        data = await request.json()
        case_text = data.get("case_text", "")
        
        print(f"\n[ANALYZE] Case text length: {len(case_text)} chars")
        
        if not case_text:
            return JSONResponse({"error": "Case text is required"}, status_code=400)
        
        # Ultra-simple prompt - ask questions directly
        analysis_prompt = f"""Read this legal document:

{case_text[:4000]}

Answer these questions about the document above:
1. What type of case is this? (Civil/Criminal/Property/Contract)
2. Which court has jurisdiction?
3. Who is the petitioner/plaintiff?
4. Who is the respondent/defendant?
5. What legal sections are mentioned?
6. What is this case about in 1-2 sentences?
7. List 3 key facts from the document.

Format your answer ONLY as JSON:
{{"case_type": "answer1", "jurisdiction": "answer2", "parties": {{"petitioner": "answer3", "respondent": "answer4"}}, "sections": ["answer5"], "case_summary": "answer6", "key_facts": ["fact1", "fact2", "fact3"], "complexity_score": 65}}"""
        
        answer = call_llm(analysis_prompt, expect_json=True)
        
        print(f"[ANALYZE] Answer type: {type(answer)}")
        print(f"[ANALYZE] Answer value: {str(answer)[:500]}")
        
        if isinstance(answer, dict):
            print(f"[ANALYZE] SUCCESS - Returning parsed dict")
            return {"analysis": answer}
        
        parsed = extract_json_from_response(str(answer)) if answer else None
        print(f"[ANALYZE] Parsed result: {parsed}")
        
        if parsed:
            print(f"[ANALYZE] SUCCESS - Returning parsed JSON")
            return {"analysis": parsed}
        
        # Enhanced fallback with more detail
        print(f"[ANALYZE] WARNING - USING FALLBACK DATA - Groq failed or returned invalid JSON")
        return {"analysis": {
            "case_type": "Civil",
            "sub_category": "Contract Dispute - Payment Default",
            "jurisdiction": "District Civil Court",
            "court_location": "District Court at specified location",
            "sections": ["Indian Contract Act, 1872 - Section 73 (Compensation for loss or damage)"],
            "complexity_score": 65,
            "urgency_level": "High",
            "estimated_duration": "6-12 months",
            "parties": {
                "petitioner": "ABC Technologies Pvt. Ltd. (Technology Services Company)",
                "petitioner_type": "Company",
                "respondent": "XYZ Solutions Pvt. Ltd. (Client Company)",
                "respondent_type": "Company",
                "other_parties": []
            },
            "case_summary": "This is a civil complaint filed by ABC Technologies against XYZ Solutions for breach of contract and recovery of outstanding payments. The complainant provided software development services as per a written agreement, but the respondent failed to honor payment obligations despite repeated reminders and demand notices.",
            "key_facts": [
                "Written agreement executed between parties for software development services",
                "Complainant ABC Technologies fulfilled all contractual obligations",
                "Respondent XYZ Solutions defaulted on payment obligations",
                "Multiple payment reminders sent but remained unaddressed",
                "Cause of action arose upon payment default and continues"
            ],
            "legal_issues": [
                "Breach of Contract - Non-payment of agreed consideration under Contract Act 1872",
                "Recovery of Outstanding Amount - Specific Relief Act 1963",
                "Awarding of Interest and Costs - Contract Act Section 73"
            ],
            "claimed_amount": "As per agreement plus interest",
            "cause_of_action": "First arose on payment default date and continues",
            "jurisdiction_basis": "Respondent conducts business within territorial jurisdiction",
            "previous_proceedings": "None mentioned",
            "statute_of_limitations": "Within limitation period",
            "key_dates": {
                "incident_date": "Date of agreement execution",
                "filing_date": "Current filing",
                "first_hearing": "To be scheduled"
            }
        }}
        
    except Exception as e:
        print(f"[ERROR] analyze_case: {e}")
        return {"analysis": get_enhanced_fallback()["analysis"]}


@app.post("/api/calculate-risk")
async def calculate_risk(request: Request):
    """Detailed risk assessment with legal implications"""
    try:
        data = await request.json()
        case_details = data.get("case_details", {})
        evidence = data.get("evidence", [])
        
        print(f"\n[RISK] Comprehensive risk analysis...")
        
        risk_prompt = f"""Analyze the legal risk for this case. Return ONLY valid JSON with actual assessment, not placeholder values.

Case Type: {case_details.get('case_type', 'case')}
Case Summary: {case_details.get('case_summary', 'N/A')}

Provide real risk analysis in JSON format with these EXACT field names:
{{
  "overall_risk": "High/Medium/Low (choose one based on analysis)",
  "legal_penalty_probability": 75,
  "financial_risk": 60,
  "urgency_level": 80,
  "risk_factors": [["specific factor 1", "severity level"], ["specific factor 2", "severity level"]],
  "risk_explanation": "actual analysis of risks",
  "recommendations": ["specific actionable recommendation 1", "specific actionable recommendation 2"]
}}

IMPORTANT: 
- legal_penalty_probability should be 0-100 representing likelihood of legal penalties
- financial_risk should be 0-100 representing potential financial impact
- urgency_level should be 0-100 representing how urgent action is needed
- Analyze the actual case and provide realistic numbers, not generic values"""
        
        answer = call_llm(risk_prompt, expect_json=True)
        
        if isinstance(answer, dict):
            return {"risk_analysis": answer}
        
        parsed = extract_json_from_response(str(answer)) if answer else None
        if parsed:
            return {"risk_analysis": parsed}
        
        return {"risk_analysis": get_enhanced_fallback()["risk"]}
        
    except Exception as e:
        print(f"[ERROR] calculate_risk: {e}")
        return {"risk_analysis": get_enhanced_fallback()["risk"]}


@app.post("/api/case-strength")
async def calculate_case_strength(request: Request):
    """Detailed case strength analysis"""
    try:
        data = await request.json()
        case_info = data.get("case_info", {})
        evidence_list = data.get("evidence", [])
        
        print(f"\n[STRENGTH] Detailed strength analysis...")
        
        strength_prompt = f"""Analyze case strength. Return ONLY valid JSON with real analysis, not placeholder values.

Case Type: {case_info.get('case_type', 'case')}
Key Facts: {case_info.get('key_facts', [])}
Case Summary: {case_info.get('case_summary', 'N/A')}

Provide actual strength analysis in JSON format with these EXACT field names:
{{
  "overall_strength": "Strong/Moderate/Weak (choose based on ACTUAL analysis)",
  "strength_score": 72,
  "win_probability": 65,
  "strengths": ["specific strength 1 from this case", "specific strength 2 from this case", "specific strength 3 from this case"],
  "weaknesses": ["specific weakness 1 from this case", "specific weakness 2 from this case"],
  "recommendations": ["specific action 1 to strengthen this case", "specific action 2 to strengthen this case"]
}}

IMPORTANT:
- strength_score should be 0-100 based on ACTUAL case analysis, not a generic number
- win_probability should be 0-100 based on analyzing the strengths vs weaknesses (higher score means better chance of winning)
- Analyze the specific facts and circumstances to determine if case is strong (70-100), moderate (40-69), or weak (0-39)
- Provide case-specific strengths and weaknesses, not generic legal advice
- Field names must be strengths and weaknesses (plural)"""
        
        answer = call_llm(strength_prompt, expect_json=True)
        
        if isinstance(answer, dict):
            return {"strength_analysis": answer}
        
        parsed = extract_json_from_response(str(answer)) if answer else None
        if parsed:
            return {"strength_analysis": parsed}
        
        return {"strength_analysis": get_enhanced_fallback()["strength"]}
        
    except Exception as e:
        print(f"[ERROR] case_strength: {e}")
        return {"strength_analysis": get_enhanced_fallback()["strength"]}


def get_enhanced_fallback():
    """Enhanced fallback responses with more detail"""
    return {
        "analysis": {
            "case_type": "Civil",
            "sub_category": "Contract Dispute - Payment Default",
            "jurisdiction": "District Civil Court",
            "sections": ["Indian Contract Act, 1872 - Section 73"],
            "complexity_score": 65,
            "urgency_level": "High",
            "parties": {
                "petitioner": "Complainant Company",
                "respondent": "Defendant Company"
            },
            "case_summary": "Contract breach case with payment default",
            "key_facts": ["Contract executed", "Services performed", "Payment default"],
            "legal_issues": ["Breach of contract", "Recovery of dues"]
        },
        "risk": {
            "overall_risk": "Medium-High",
            "risk_score": 70,
            "legal_penalty_probability": 60,
            "financial_risk": 70,
            "urgency_level": 75,
            "risk_factors": [
                {
                    "factor": "Pending litigation",
                    "severity": "High",
                    "impact": "Financial and time commitment",
                    "mitigation": "Early settlement exploration"
                }
            ],
            "risk_explanation": "Moderate to high risk due to contract dispute nature with financial exposure and litigation costs"
        },
        "strength": {
            "strength_score": 65,
            "win_probability": 60,
            "strengths": [
                {
                    "aspect": "Written agreement",
                    "description": "Contract documentation exists",
                    "legal_weight": "High"
                }
            ],
            "weaknesses": [
                {
                    "aspect": "Evidence gaps",
                    "description": "Some documentation missing",
                    "legal_impact": "Medium"
                }
            ],
            "recommendations": [
                {
                    "priority": "High",
                    "action": "Gather complete evidence",
                    "timeline": "Immediate"
                }
            ]
        }
    }
@app.post("/api/find-precedents")
async def find_precedents(request: Request):
    """Find similar precedents"""
    try:
        data = await request.json()
        case_description = data.get("case_description", "")
        case_type = data.get("case_type", "")
        
        print(f"\n[PRECEDENTS] Finding for {case_type}...")
        
        precedent_prompt = f"""Return ONLY a valid JSON array of 2-3 ACTUAL Indian legal precedents. No explanatory text, no placeholder values.

Case Type: {case_type}
Case Description: {case_description}

Find real Indian Supreme Court or High Court precedents that are relevant to this specific case type.

JSON array structure with these EXACT field names:
[{{
  "title": "Actual Case Name vs Other Party Name",
  "citation": "AIR 2018 SC 1234 or similar Indian citation",
  "verdict": "Brief summary of what the court ruled",
  "reasoning": "Key legal reasoning the court used in making this decision",
  "relevance": "Explain why this precedent is relevant to the current case",
  "keyTakeaway": "Main legal principle established by this case",
  "similarity": 85
}}]

IMPORTANT:
- Use REAL Indian case law precedents from Supreme Court or High Court
- similarity should be 0-100 showing how similar this precedent is to current case
- verdict should describe what the court decided
- reasoning should explain the court legal logic
- All fields must have actual content not N/A or placeholders"""
        
        answer = call_llm(precedent_prompt, expect_json=True)
        
        if isinstance(answer, list):
            return {"precedents": answer}
        
        parsed = extract_json_from_response(str(answer)) if answer else None
        if parsed and isinstance(parsed, list):
            return {"precedents": parsed}
        
        return {"precedents": get_default_responses()["precedents"]}
        
    except Exception as e:
        print(f"[ERROR] find_precedents: {e}")
        return {"precedents": get_default_responses()["precedents"]}


@app.post("/api/generate-timeline")
async def generate_timeline(request: Request):
    """Generate case timeline"""
    try:
        data = await request.json()
        case_type = data.get("case_type", "Criminal")
        jurisdiction = data.get("jurisdiction", "District Court")
        filing_date = data.get("filing_date", "2024-01-15")
        
        print(f"\n[TIMELINE] Generating for {case_type}...")
        
        timeline_prompt = f"""Return ONLY a valid JSON array. No explanatory text.

Generate timeline for: {case_type} in {jurisdiction}
Filing date: {filing_date}

JSON array of 4-5 stages:
[{{
  "stage": "string",
  "date": "YYYY-MM-DD",
  "status": "Completed/Upcoming",
  "description": "string"
}}]"""
        
        answer = call_llm(timeline_prompt, expect_json=True)
        
        if isinstance(answer, list):
            return {"timeline": answer}
        
        parsed = extract_json_from_response(str(answer)) if answer else None
        if parsed and isinstance(parsed, list):
            return {"timeline": parsed}
        
        return {"timeline": get_default_responses()["timeline"]}
        
    except Exception as e:
        print(f"[ERROR] generate_timeline: {e}")
        return {"timeline": get_default_responses()["timeline"]}


@app.post("/api/summarise-pdf")
async def summarise_pdf(file: UploadFile = File(...)):
    """Summarise a PDF document"""
    try:
        content = await file.read()
        pdf_file = io.BytesIO(content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text = ""
        for page in pdf_reader.pages[:10]:  # First 10 pages
            text += page.extract_text() + "\n"
        
        # If no text extracted, try OCR
        if not text.strip() and OCR_AVAILABLE:
            print("[PDF] No text found, trying OCR...")
            try:
                images = convert_from_bytes(content, first_page=1, last_page=10)
                for i, image in enumerate(images):
                    print(f"[OCR] Processing page {i+1}...")
                    text += pytesseract.image_to_string(image) + "\n"
            except Exception as ocr_error:
                print(f"[OCR ERROR] {ocr_error}")
                return {"summary": f"⚠️ This appears to be a scanned/image-based PDF.\n\nTo process scanned PDFs, Tesseract OCR must be installed:\n1. Download from: https://github.com/UB-Mannheim/tesseract/wiki\n2. Install to default location\n3. Restart the backend\n\nFor now, please use a text-based PDF or manually copy the text."}
        
        if not text.strip():
            if OCR_AVAILABLE:
                return {"summary": "⚠️ Unable to extract text from this PDF.\n\nPossible causes:\n• PDF is encrypted\n• PDF is image-based without selectable text\n• PDF uses unsupported encoding\n\nTry:\n• Using a different PDF file\n• Converting the PDF to text format first\n• Manually copying the text"}
            else:
                return {"summary": "⚠️ Unable to extract text from this PDF.\n\nThis appears to be a scanned/image PDF. OCR libraries are not installed.\n\nInstall OCR support: pip install pdf2image pytesseract Pillow\nThen install Tesseract: https://github.com/UB-Mannheim/tesseract/wiki"}
        
        prompt = f"""Summarize this legal document concisely in 3-4 paragraphs:

{text[:3000]}

Provide: 1) Document type, 2) Key parties, 3) Main terms/provisions, 4) Important dates/amounts"""
        
        summary = call_llm(prompt, expect_json=False)
        
        return {"summary": summary or "Unable to generate summary"}
        
    except Exception as e:
        print(f"[ERROR] summarise_pdf: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)


@app.post("/api/extract-pdf-text")
async def extract_pdf_text(file: UploadFile = File(...)):
    """Extract raw text from PDF for case analysis"""
    try:
        print(f"\n[PDF] Extracting text from: {file.filename}")
        content = await file.read()
        pdf_file = io.BytesIO(content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text = ""
        for page in pdf_reader.pages:  # All pages
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        
        # If no text extracted, try OCR
        if not text.strip() and OCR_AVAILABLE:
            print("[PDF] No text found, trying OCR on all pages...")
            try:
                images = convert_from_bytes(content)
                for i, image in enumerate(images):
                    print(f"[OCR] Processing page {i+1}/{len(images)}...")
                    text += pytesseract.image_to_string(image) + "\n"
            except Exception as ocr_error:
                print(f"[OCR ERROR] {ocr_error}")
                return JSONResponse({"error": "⚠️ This appears to be a scanned/image-based PDF. Tesseract OCR must be installed. Download from: https://github.com/UB-Mannheim/tesseract/wiki"}, status_code=400)
        
        print(f"[PDF] Extracted {len(text)} characters from {len(pdf_reader.pages)} pages")
        
        if not text.strip():
            if OCR_AVAILABLE:
                return JSONResponse({"error": "⚠️ Unable to extract text. PDF may be encrypted or uses unsupported encoding. Try a different PDF or manually copy the text."}, status_code=400)
            else:
                return JSONResponse({"error": "⚠️ This appears to be a scanned PDF. Install OCR: pip install pdf2image pytesseract Pillow, then Tesseract OCR."}, status_code=400)
        
        return {"text": text}
        
    except Exception as e:
        print(f"[ERROR] extract_pdf_text: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)


@app.post("/api/upload-evidence")
async def upload_evidence(file: UploadFile = File(...)):
    """Upload and analyze evidence - FULL TEXT"""
    try:
        print(f"\n[EVIDENCE] Uploading: {file.filename}")
        
        content = await file.read()
        extracted_text = ""
        
        if file.filename.endswith('.pdf'):
            pdf_file = io.BytesIO(content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            for page in pdf_reader.pages:
                extracted_text += page.extract_text() + "\n"
            print(f"[EVIDENCE] Extracted {len(extracted_text)} chars")
        elif file.filename.endswith(('.txt', '.doc', '.docx')):
            extracted_text = content.decode('utf-8', errors='ignore')
        
        # Analyze FULL evidence text
        evidence_prompt = f"""Analyze this complete evidence document:

FULL DOCUMENT:
{extracted_text}

Return ONLY valid JSON:
{{
  "document_type": "FIR or Complaint or Agreement or Statement or Report",
  "weight": 85,
  "impact": "Critical or High or Medium or Low",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "strengthens_case": true,
  "summary": "2-3 sentence summary"
}}"""
        
        answer = call_llm(evidence_prompt, expect_json=True)
        analysis = answer if isinstance(answer, dict) else extract_json_from_response(str(answer))
        
        if not analysis:
            analysis = {
                "document_type": "Legal Document",
                "weight": 75,
                "impact": "Medium",
                "key_points": ["Document processed"],
                "strengthens_case": True,
                "summary": "Evidence document uploaded successfully"
            }
        
        return {
            "success": True,
            "filename": file.filename,
            "extracted_text": extracted_text[:500],
            "analysis": analysis
        }
        
    except Exception as e:
        print(f"[ERROR] upload_evidence: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/")
async def root():
    return {
        "message": "NyayaSahaya API",
        "status": "running",
        "ollama_url": OLLAMA_URL,
        "model": OLLAMA_MODEL
    }


@app.get("/health")
async def health_check():
    """Check Ollama status"""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get("models", [])
            return {"status": "healthy", "ollama": "connected", "models": [m["name"] for m in models]}
        return {"status": "unhealthy", "ollama": "error"}
    except:
        return {"status": "unhealthy", "ollama": "not_running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)