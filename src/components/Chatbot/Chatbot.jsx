import React, { useState, useEffect, useRef } from "react";
import './Chatbot.css';

function Chatbot() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "👋 Hello! I'm your NyayaSahaya AI Assistant. Ask me anything about Indian law, legal procedures, or your case!" }
  ]);
  const [input, setInput] = useState("");
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const BASE_URL = "http://localhost:8000";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = ['application/pdf', 'text/plain', 'application/msword', 
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid document (PDF, TXT, DOC, DOCX)");
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size should be less than 10MB");
      return;
    }

    setUploadedFile(file);
    setError(null);

    // Add a message showing file upload
    setMessages(prev => [...prev, { 
      sender: "user", 
      text: `📎 Uploaded: ${file.name}`,
      isFile: true 
    }]);

    // Process the file
    await processFile(file);
  };

  // Process and extract text from file
  const processFile = async (file) => {
    setIsTyping(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use the correct endpoint that exists in your backend
      const response = await fetch(`${BASE_URL}/api/upload-evidence`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();

      if (data.success && data.extracted_text) {
        setExtractedText(data.extracted_text);
        
        // Show analysis if available
        if (data.analysis) {
          try {
            const analysisObj = JSON.parse(data.analysis);
            const formattedAnalysis = `
📄 **Document Analysis:**

**Type:** ${analysisObj.document_type || 'Unknown'}
**Impact:** ${analysisObj.impact || 'N/A'}
**Weight:** ${analysisObj.weight || 'N/A'}/100

**Key Points:**
${analysisObj.key_points?.map((point, i) => `${i + 1}. ${point}`).join('\n') || 'None'}

**Summary:** ${analysisObj.summary || 'No summary available'}

You can now ask me questions about this document!
            `;
            setMessages(prev => [...prev, { 
              sender: "bot", 
              text: formattedAnalysis
            }]);
          } catch (e) {
            // If parsing fails, show raw analysis
            setMessages(prev => [...prev, { 
              sender: "bot", 
              text: `✅ Document processed!\n\n${data.analysis}\n\nYou can now ask me questions about this document!`
            }]);
          }
        } else {
          setMessages(prev => [...prev, { 
            sender: "bot", 
            text: `✅ Document processed! I've extracted ${data.extracted_text.length} characters. You can now ask me questions about this document!`
          }]);
        }
      } else {
        setMessages(prev => [...prev, { 
          sender: "bot", 
          text: "⚠️ I couldn't process the document. Please try again or ask your question directly." 
        }]);
        setError("Failed to process document");
      }
    } catch (err) {
      console.error("Error processing file:", err);
      setMessages(prev => [
        ...prev,
        { sender: "bot", text: "⚠️ I couldn't process the document. Please try again or ask your question directly." }
      ]);
      setError("Failed to process document");
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async () => {
    if (input.trim()) {
      const userMessage = input;
      setMessages(prev => [...prev, { sender: "user", text: userMessage }]);
      setIsTyping(true);
      setError(null);
      
      try {
        // If there's extracted text from a document, include it as context
        let questionToSend = userMessage;
        if (extractedText) {
          questionToSend = `Context from uploaded document:\n${extractedText.substring(0, 2000)}\n\nUser question: ${userMessage}`;
        }

        const response = await fetch(`${BASE_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            question: questionToSend,
            has_document: !!uploadedFile 
          }),
        });
        
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        setMessages(prev => [...prev, { sender: "bot", text: data.answer }]);
      } catch (err) {
        console.error("Error sending message:", err);
        setMessages(prev => [
          ...prev,
          { sender: "bot", text: "⚠️ I'm having trouble connecting right now. Please try again in a moment." }
        ]);
        setError("Connection error - please check if the server is running");
      } finally {
        setIsTyping(false);
        setInput("");
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setExtractedText("");
    setMessages(prev => [...prev, { 
      sender: "bot", 
      text: "Document cleared. Feel free to upload a new one or continue asking questions!" 
    }]);
  };

  return (
    <div className="chatbot-modern-container">
      <div className="chat-background-glow"></div>
      
      <div className="chat-window-modern">
        <div className="chat-header-modern">
          <div className="header-left">
            <div className="bot-avatar-modern">
              <span className="avatar-icon">🤖</span>
              <span className="status-indicator"></span>
            </div>
            <div className="header-info">
              <h2 className="chat-title-modern">NyayaSahaya AI</h2>
              <p className="chat-status">Always here to help • Powered by AI</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="icon-button" 
              title="New Chat"
              onClick={() => {
                setMessages([{ sender: "bot", text: "👋 Hello! I'm your NyayaSahaya AI Assistant. Ask me anything about Indian law, legal procedures, or your case!" }]);
                setUploadedFile(null);
                setExtractedText("");
                setError(null);
              }}
            >
              🔄
            </button>
          </div>
        </div>

        {/* File Upload Indicator */}
        {uploadedFile && (
          <div className="file-indicator">
            <div className="file-info">
              <span className="file-icon">📄</span>
              <span className="file-name">{uploadedFile.name}</span>
            </div>
            <button className="clear-file-btn" onClick={clearFile} title="Remove file">
              ✕
            </button>
          </div>
        )}

        <div className="chat-messages-modern">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message-modern ${msg.sender === "user" ? "user-message-modern" : "bot-message-modern"}`}
            >
              <div className="message-avatar">
                {msg.sender === "user" ? "👤" : "🤖"}
              </div>
              <div className="message-bubble">
                <div className="message-text" style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.text}
                </div>
                <div className="message-time">
                  {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message-modern bot-message-modern">
              <div className="message-avatar">🤖</div>
              <div className="message-bubble typing-bubble">
                <div className="typing-indicator-modern">
                  <span className="typing-dot-modern"></span>
                  <span className="typing-dot-modern"></span>
                  <span className="typing-dot-modern"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-input-container-modern">
          {error && (
            <div className="error-banner">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}
          
          <div className="input-wrapper-modern">
            <div className="input-field-wrapper">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="chat-input-modern"
                placeholder="Ask about legal procedures, rights, or get case guidance..."
                disabled={isTyping}
              />
              <div className="input-actions">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.txt,.doc,.docx"
                  style={{ display: 'none' }}
                />
                <button 
                  className="attachment-button" 
                  title="Attach document"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTyping}
                >
                  📎
                </button>
              </div>
            </div>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="send-button-modern"
              title="Send message"
            >
              <span className="send-icon">✨</span>
            </button>
          </div>
          
          <div className="input-hint">
            Press <kbd>Enter</kbd> to send • <kbd>Shift + Enter</kbd> for new line • <kbd>📎</kbd> to upload documents
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;