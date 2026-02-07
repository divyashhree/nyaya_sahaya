# NyayaSahaya Legal Assistant

## 🚀 Overview
NyayaSahaya is a comprehensive AI-powered legal assistance platform that provides intelligent case analysis, legal document generation, chatbot assistance, and document summarization. Built with React + Vite for the frontend and FastAPI for the backend, featuring **Groq Cloud integration** for ultra-fast AI responses (1-3 seconds).

## ✨ Key Features

### 1. **Case Dashboard** 
- **Comprehensive Case Analysis**: Upload case details or PDF documents for instant AI-powered analysis
- **Win Probability Assessment**: Get data-driven predictions on case outcomes with detailed strength/weakness analysis
- **Risk Metrics Dashboard**: 
  - Legal penalty probability
  - Financial risk assessment
  - Urgency level indicators
- **Precedent Analysis**: AI-powered search for relevant case precedents with similarity scoring
- **Timeline Generation**: Automatic chronological timeline creation from case events
- **PDF Export**: Generate professional PDF reports with all case analysis
- **Case History**: Save and load previous case analyses

### 2. **Legal Chatbot**
- AI-powered legal Q&A using RAG (Retrieval-Augmented Generation)
- Context-aware responses with IPC law database
- Structured legal advice with applicable laws, consequences, and steps
- Conversation memory for contextual follow-ups

### 3. **Document Summarizer**
- Upload PDF legal documents for instant AI summarization
- OCR support for scanned/image-based PDFs
- Extract key information: document type, parties, terms, dates
- Markdown formatting for readable summaries

### 4. **Document Generator**
- Generate professional legal documents (Sale Deed, Will, Power of Attorney)
- Dynamic form-based input
- PDF generation with proper legal formatting

## 🎨 Modern UI Design
- **Purple Gradient Theme**: Clean, professional gradient background (#667eea → #764ba2 → #f093fb)
- **White Glassmorphism Cards**: Translucent white cards with backdrop blur for modern aesthetic
- **Dark Text on Light Backgrounds**: WCAG-compliant color contrast for maximum readability
- **Responsive Design**: Fully responsive across desktop, tablet, and mobile devices
- **Smooth Animations**: Subtle transitions and hover effects for enhanced UX

## 🏗️ Architecture

### Frontend Stack
- **Framework**: React 18 with Vite for fast HMR
- **Routing**: React Router DOM v6
- **Styling**: Custom CSS with CSS variables
- **PDF Generation**: html2pdf.js for client-side PDF creation
- **Notifications**: react-hot-toast for user feedback
- **Components**:
  - Home: Landing page with feature showcase
  - Case Dashboard: Comprehensive case analysis interface
  - Chatbot: Legal Q&A interface
  - DocSummariser: PDF document summarization
  - DocGenerator: Legal document creation
  - About Us: Team information

### Backend Stack
- **Framework**: FastAPI with uvicorn
- **LLM Integration**: 
  - **Primary**: Groq Cloud API (llama-3.1-8b-instant) - 1-3 second responses
  - **Fallback**: Ollama for local inference
- **Vector Search**: FAISS with sentence-transformers
- **Document Processing**: 
  - PyPDF2 for text-based PDFs
  - pdf2image + pytesseract for OCR (scanned PDFs)
- **Features**:
  - CORS middleware for cross-origin requests
  - JSON-structured AI responses
  - Parallel API calls for efficiency
  - Auto-reload during development

## API Endpoints

### Chat API
```
POST /api/chat
```
- Request body: `{ "question": string }`
- Response format:
```json
{
   🔌 API Endpoints

### Case Analysis APIs
```
POST /api/analyze-risk
```
Analyzes case for legal, financial, and urgency risks
- Request: `{ "case_text": string }`
- Response: `{ "legal_penalty_probability": number, "financial_risk": string, "urgency_level": string, ... }`

```
POST /api/analyze-strength
```
Evaluates case strength and win probability
- Request: `{ "case_text": string }`
- Response: `{ "win_probability": number, "strengths": array, "weaknesses": array, ... }`

```
POST /api/find-precedents
```
Searches for relevant legal precedents
- Request: `{ "case_text": string }`
- Response: `{ "precedents": [{ "title", "citation", "verdict", "reasoning", "similarity", ... }] }`

```
POST /api/generate-timeline
```
Creates chronological timeline from case events
- Request: `{ "case_text": string }`
- Response: `{ "events": [{ "date", "event", "significance" }] }`

### Document Processing APIs
```
POST /api/extract-pdf-text
```🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Python 3.10+
- (Optional) Tesseract OCR for scanned PDF support

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend runs on `http://localhost:5173`

### Backend Setup
```bash
# Navigate to backend directory
cd NyayaSahaya-bot

# Install dependencies
pip install -r requirements.txt

# Set environment variables
# Create .env file with:
# USE_GROQ=true
# GROQ_API_KEY=your_groq_api_key

# Start backend server
python -m uvicorn app:app --reload --port 8001
```
Backend runs on `http://localhost:8001`

### Optional: OCR Support
For scanned PDF processing:
1. Install Tesseract OCR: https://github.com/UB-Mannheim/tesseract/wiki
2. Python packages are already in requirements.txt (pdf2image, pytesseract, Pillow)

## 📦 Dependencies

### Frontend
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.29.0",
  "html2pdf.js": "^0.10.2",
  "react-hot-toast": "^2.4.1"
}
```

### Backend
- **FastAPI**: Web framework
- **Groq**: LLM API client for fast inference
-  🚀 Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/divyashhree/nyaya_sahaya.git
cd nyaya_sahaya
git checkout groq  # Use the groq branch for latest features
```

2. **Start Backend**
```bash
cd NyayaSahaya-bot
pip install -r requirements.txt
# Add GROQ_API_KEY to .env
python -m uvicorn app:app --reload --port 8001
```

3. **Start Frontend** (in new terminal)
```bash
cd nyaya_sahaya
npm install
npm run dev
```

4. **Access the application**
- Open `http://localhost:5173` in your browser
- Backend API docs: `http://localhost:8001/docs`

## 🔧 Technical Highlights

### Performance Optimizations
- **Groq Cloud**: Ultra-fast LLM responses (1-3 seconds vs 30+ seconds with local models)
- **Parallel API Calls**: Risk, strength, precedents, and timeline analyzed simultaneously
- **Client-side PDF Generation**: No server load for PDF exports
- **Vite HMR**: Instant hot module replacement during development

### Code Quality
- **Modular Architecture**: Separate components for each feature
- **Error Handling**: Comprehensive try-catch with user-friendly error messages
- **OCR Fallback**: Automatic OCR for scanned PDFs when text extraction fails
- **Responsive Design**: Mobile-first approach with breakpoints
- **Accessibility**: WCAG-compliant color contrast ratios

### Security
- CORS middleware with origin whitelisting
- API key protection via environment variables
- Input sanitization and validation
- Secure file upload handling

## 📝 Changelog (Groq Branch)

### Latest Updates
✅ **Groq Integration**: Switched from slow local Ollama to Groq Cloud API (1-3s responses)  
✅ **Purple Gradient Theme**: Complete UI redesign with modern glassmorphism aesthetic  
✅ **Text Visibility Fix**: Changed all text to dark colors for readability on white backgrounds  
✅ **OCR Support**: Added pdf2image + pytesseract for scanned PDF processing  
✅ **Bug Fixes**:
  - Risk metrics now display correct percentages (not 0%)
  - Case strength shows actual win probability (not hardcoded 60%)
  - Precedents show real case data (not N/A placeholders)
  - PDF export generates complete reports (not blank pages)
✅ **Markdown Rendering**: Bold text in summaries now properly formatted  
✅ **Case History**: Save and load analyzed cases  
✅ **Timeline Generation**: Automatic chronological event extraction

## 🤝 Contributing
Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License.

## 🙏 Acknowledgments
- **Groq** for ultra-fast LLM inference
- **LangChain** for RAG framework
- **FastAPI** for backend framework
- **React + Vite** for frontend tooling

## 📧 Support
For issues, questions, or contributions, please visit:
https://github.com/divyashhree/nyaya_sahaya

---

**Note**: This is the Groq branch featuring enhanced performance and modern UI. For the original version, see the `main` branch
  - Streamlit

### Environment Setup
Required environment variables:
```
TOGETHER_API_KEY=your_api_key
```

### Security Features
- CORS middleware implementation
- API key protection
- Secure PDF generation
- Input validation

## Installation and Setup

1. Clone the repository
2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
- Create a `.env` file
- Add required API keys and configurations

5. Start the services:
- Frontend: `npm start`
- Backend: `python -m uvicorn app:app --reload`
- Document Generator: `streamlit run doc_generator.py`

## Best Practices

### Code Organization
- Modular component structure
- Separate routing logic
- Consistent styling approach
- Clear separation of concerns

### Error Handling
- Comprehensive error checking in document generation
- API error responses
- User input validation
- Graceful fallbacks

### Performance Considerations
- Efficient PDF generation
- Optimized vector search
- Memory management for chat context
- Responsive design implementation

## Future Enhancements
1. Additional document types support
2. Enhanced chatbot capabilities
3. Multi-language support
4. Advanced document analysis features
5. User authentication system
6. Document storage and management
7. Integration with legal databases

## Maintenance and Support
- Regular updates to legal templates
- API monitoring and maintenance
- Database optimization
- User feedback integration

This documentation serves as a comprehensive guide for developers working on or maintaining the NyayaSahaya Legal Assistant platform. For specific implementation details, refer to the inline comments in the respective source files.
