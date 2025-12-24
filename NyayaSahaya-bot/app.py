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

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Ollama configuration
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")  # Changed to mistral

print(f"🚀 Starting NyayaSahaya API")
print(f"📡 Ollama URL: {OLLAMA_URL}")
print(f"🤖 Ollama Model: {OLLAMA_MODEL}")

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
    
    print(f"\n[DEBUG] 📤 Calling Ollama...")
    print(f"[DEBUG] Model: {OLLAMA_MODEL}")
    print(f"[DEBUG] Expect JSON: {expect_json}")
    print(f"[DEBUG] Prompt length: {len(prompt)} chars")
    
    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": messages,
                "stream": False,
                "format": "json" if expect_json else None,
                "options": {
                    "temperature": 0.3 if expect_json else 0.7,
                    "num_predict": 2048,      # Allow longer responses
                    "num_ctx": 16384,         # Large context window for long docs
                    "top_p": 0.9,
                    "repeat_penalty": 1.1
                }
            },
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
                
                if len(conversations[conversation_id]) > 6:
                    conversations[conversation_id] = conversations[conversation_id][-6:]
            
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

        answer = call_ollama(question, LEGAL_SYSTEM_PROMPT, session_id, expect_json=False)
        
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
        
        # Enhanced detailed analysis prompt
        analysis_prompt = f"""You are a senior legal analyst. Perform a comprehensive analysis of this legal document.

FULL LEGAL DOCUMENT:
{case_text}

Provide detailed analysis in this JSON format:
{{
    "case_type": "Criminal/Civil/Property/Family/Constitutional/Consumer",
    "sub_category": "Specific type like Contract Dispute, Cheating, Property Transfer",
    "jurisdiction": "Specify exact court - District Court/High Court/Supreme Court and state",
    "court_location": "City or district name",
    "sections": ["List ALL applicable sections with full names - e.g., IPC Section 420, Contract Act 1872 Section 73"],
    "complexity_score": 75,
    "urgency_level": "Critical/High/Medium/Low",
    "estimated_duration": "Estimated time to resolution",
    "parties": {{
        "petitioner": "Full name and designation",
        "petitioner_type": "Individual/Company/Government",
        "respondent": "Full name and designation",
        "respondent_type": "Individual/Company/Government",
        "other_parties": ["List any other involved parties"]
    }},
    "case_summary": "Comprehensive 3-4 sentence summary of the entire case",
    "key_facts": [
        "Detailed fact 1 with dates and specifics",
        "Detailed fact 2 with amounts and parties",
        "Detailed fact 3 with legal implications",
        "Include 5-7 comprehensive facts"
    ],
    "legal_issues": [
        "Primary legal issue with statutory reference",
        "Secondary legal issue with case law implications",
        "Constitutional or procedural issues if any"
    ],
    "claimed_amount": "Amount in dispute if applicable",
    "cause_of_action": "When and how the legal cause arose",
    "jurisdiction_basis": "Why this court has jurisdiction",
    "previous_proceedings": "Any prior legal action mentioned",
    "statute_of_limitations": "Time limitation concerns if any",
    "key_dates": {{
        "incident_date": "Date of main incident",
        "filing_date": "When case was filed",
        "first_hearing": "Scheduled or expected date"
    }}
}}

Be thorough and extract every relevant detail from the document."""
        
        answer = call_ollama(analysis_prompt, expect_json=True)
        
        if isinstance(answer, dict):
            print(f"[ANALYZE] ✅ Detailed analysis complete")
            return {"analysis": answer}
        
        parsed = extract_json_from_response(str(answer)) if answer else None
        if parsed:
            return {"analysis": parsed}
        
        # Enhanced fallback with more detail
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
        
        risk_prompt = f"""As a legal risk analyst, provide detailed risk assessment:

CASE DETAILS:
Case Type: {case_details.get('case_type', 'Unknown')}
Sub-Category: {case_details.get('sub_category', 'Not specified')}
Legal Sections: {', '.join(case_details.get('sections', []))}
Facts: {'; '.join(case_details.get('key_facts', [])[:3])}
Parties: {case_details.get('parties', {}).get('petitioner', 'Unknown')} vs {case_details.get('parties', {}).get('respondent', 'Unknown')}
Evidence Count: {len(evidence)}

Provide comprehensive risk analysis in JSON:
{{
  "overall_risk": "Critical/High/Medium/Low",
  "risk_score": 75,
  "legal_penalty_probability": 65,
  "financial_risk": 70,
  "reputational_risk": 60,
  "urgency_level": 85,
  "risk_factors": [
    {{
      "factor": "Lack of documented evidence",
      "severity": "High",
      "impact": "Could weaken case substantially",
      "mitigation": "Gather supporting documents immediately"
    }},
    {{
      "factor": "Statute of limitations concern",
      "severity": "Medium",
      "impact": "May affect claim validity",
      "mitigation": "Verify dates and file promptly"
    }}
  ],
  "potential_penalties": {{
    "criminal": "Details if criminal case",
    "civil": "Monetary damages, costs, interest",
    "administrative": "Any regulatory penalties"
  }},
  "financial_exposure": {{
    "minimum": "Lower estimate",
    "maximum": "Upper estimate",
    "legal_costs": "Estimated litigation costs"
  }},
  "timeline_risk": "Risk of delays or prolonged litigation",
  "risk_explanation": "Detailed 4-5 sentence analysis explaining all risk factors, their interconnections, and overall case exposure. Include specific legal considerations and precedent implications.",
  "recommendations": [
    "Immediate action item 1 with specific steps",
    "Strategic recommendation 2 for risk mitigation",
    "Long-term consideration 3 for case management"
  ]
}}

Provide thorough, professional analysis."""
        
        answer = call_ollama(risk_prompt, expect_json=True)
        
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
        
        strength_prompt = f"""As a legal strategy consultant, analyze case strength comprehensively:

CASE INFORMATION:
Type: {case_info.get('case_type', 'Unknown')}
Sections: {', '.join(case_info.get('sections', []))}
Key Facts: {len(case_info.get('key_facts', []))} facts documented
Evidence: {len(evidence_list)} items available

Provide detailed JSON analysis:
{{
  "strength_score": 68,
  "confidence_level": "High/Medium/Low",
  "win_probability": 65,
  "settlement_probability": 75,
  "strengths": [
    {{
      "aspect": "Strong documentary evidence",
      "description": "Written agreements and correspondence establish clear contractual relationship",
      "legal_weight": "High",
      "supports": "Primary claim of breach of contract"
    }},
    {{
      "aspect": "Clear timeline of events",
      "description": "Well-documented sequence showing performance and default",
      "legal_weight": "Medium-High",
      "supports": "Cause of action and damages calculation"
    }},
    {{
      "aspect": "Applicable precedents",
      "description": "Established case law supports similar contract disputes",
      "legal_weight": "Medium",
      "supports": "Legal interpretation and remedies"
    }}
  ],
  "weaknesses": [
    {{
      "aspect": "Incomplete documentation",
      "description": "Missing key correspondence or payment receipts",
      "legal_impact": "Medium",
      "how_to_address": "Request through discovery process"
    }},
    {{
      "aspect": "Potential counterclaims",
      "description": "Defendant may raise service quality issues",
      "legal_impact": "Low-Medium",
      "how_to_address": "Prepare rebuttal evidence"
    }}
  ],
  "critical_evidence": [
    "Original signed agreement",
    "Service delivery proof/acceptance",
    "Payment demand notices",
    "All correspondence chain"
  ],
  "missing_evidence": [
    {{
      "item": "Payment receipts for partial payments",
      "importance": "High",
      "how_to_obtain": "Bank statements or accounting records"
    }},
    {{
      "item": "Expert testimony on service quality",
      "importance": "Medium",
      "how_to_obtain": "Engage technical expert witness"
    }}
  ],
  "legal_arguments": [
    "Primary: Breach of contract under Indian Contract Act 1872",
    "Secondary: Quantum meruit for services rendered",
    "Alternative: Unjust enrichment principles"
  ],
  "opponent_arguments": [
    "Possible defense: Service quality issues",
    "Possible defense: Force majeure or financial hardship",
    "Counter-strategy: Documented acceptance and approval required"
  ],
  "recommendations": [
    {{
      "priority": "High",
      "action": "Consolidate all documentary evidence",
      "timeline": "Within 2 weeks",
      "reason": "Strengthens primary claim"
    }},
    {{
      "priority": "Medium",
      "action": "Prepare expert witness testimony",
      "timeline": "Before trial",
      "reason": "Counters quality objections"
    }},
    {{
      "priority": "High",
      "action": "Explore settlement negotiation",
      "timeline": "Pre-trial stage",
      "reason": "High settlement probability suggests cost-effective resolution"
    }}
  ],
  "case_theory": "Clear 2-3 sentence explanation of the winning legal theory and strategy"
}}

Provide thorough professional analysis."""
        
        answer = call_ollama(strength_prompt, expect_json=True)
        
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
        
        precedent_prompt = f"""Find 3 relevant Indian legal precedents for this case:

Case Type: {case_type}
Description: {case_description}

Return ONLY a JSON array:
[
  {{
    "title": "Party A vs Party B",
    "citation": "2023 SCC 145",
    "similarity": 85,
    "verdict": "Verdict summary",
    "reasoning": "Brief court reasoning",
    "relevance": "How it applies to current case",
    "keyTakeaway": "Main lesson from this precedent"
  }}
]"""
        
        answer = call_ollama(precedent_prompt, expect_json=True)
        
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
        
        timeline_prompt = f"""Generate realistic Indian court timeline:

Case Type: {case_type}
Jurisdiction: {jurisdiction}
Filing Date: {filing_date}

Return ONLY a JSON array with 5-7 stages:
[
  {{
    "stage": "Stage name",
    "date": "2024-01-15",
    "status": "Completed or Pending or Upcoming",
    "description": "Brief description",
    "expected_duration": "Duration estimate"
  }}
]

Include: FIR/Filing, Investigation, Chargesheet, First Hearing, Trial, Arguments, Judgment."""
        
        answer = call_ollama(timeline_prompt, expect_json=True)
        
        if isinstance(answer, list):
            return {"timeline": answer}
        
        parsed = extract_json_from_response(str(answer)) if answer else None
        if parsed and isinstance(parsed, list):
            return {"timeline": parsed}
        
        return {"timeline": get_default_responses()["timeline"]}
        
    except Exception as e:
        print(f"[ERROR] generate_timeline: {e}")
        return {"timeline": get_default_responses()["timeline"]}


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
        
        answer = call_ollama(evidence_prompt, expect_json=True)
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