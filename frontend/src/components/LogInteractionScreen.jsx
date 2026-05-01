import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addChatMessage, addLog, setLoading, setLogs, updateFormData } from '../store/interactionSlice';
import { Send, Bot, Loader2, Mic, Search, Plus, ShieldCheck, TrendingUp, Zap, FileText, Video, Globe } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './LogInteractionScreen.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const LogInteractionScreen = () => {
  return (
    <div className="crm-app-container">
      <h1 className="page-title">Log HCP Interaction</h1>
      <div className="crm-layout">
        <div className="left-column">
          <StructuredForm />
        </div>
        <div className="right-column">
          <ChatInterface />
        </div>
      </div>
      <footer className="developer-footer">
        <span className="dev-text">Designed & Developed by</span>
        <span className="dev-signature">Saroj Padhi</span>
        <div className="dev-links">
          <a href="https://www.linkedin.com/in/saroj-padhi-492979270" target="_blank" rel="noopener noreferrer" className="dev-link">
            <Globe size={16} /> LinkedIn
          </a>
          <a href="https://github.com/saroj-02" target="_blank" rel="noopener noreferrer" className="dev-link">
            <Globe size={16} /> GitHub
          </a>
          <a href="https://portfolio-8-4qo4.onrender.com/" target="_blank" rel="noopener noreferrer" className="dev-link">
            <Globe size={16} /> Portfolio
          </a>
        </div>
      </footer>
    </div>
  );
};

const StructuredForm = () => {
  const dispatch = useDispatch();
  const formData = useSelector(state => state.interaction.formData);

  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch(updateFormData({ [name]: value }));
  };

  const handleRadioChange = (value) => {
    dispatch(updateFormData({ sentiment: value }));
  };

  const handleSuggestionClick = (suggestion, url = null) => {
    // Fill the form field
    const currentFollowUps = formData.follow_ups ? formData.follow_ups + '\n' : '';
    dispatch(updateFormData({ follow_ups: currentFollowUps + suggestion.replace('+ ', '') }));
    
    // Open relevant website if URL is provided or if it's a content-type action
    if (url) {
      window.open(url, '_blank');
    } else if (suggestion.toLowerCase().includes('pdf') || suggestion.toLowerCase().includes('study')) {
      // Fallback: Open a relevant search or repository
      window.open('https://clinicaltrials.gov/search?term=Oncology', '_blank');
    } else if (suggestion.toLowerCase().includes('mechanism') || suggestion.toLowerCase().includes('video')) {
      window.open('https://www.youtube.com/results?search_query=drug+mechanism+of+action', '_blank');
    }
  };

  return (
    <div className="structured-form">
      <div className="section-header">Interaction Details</div>
      
      <div className="form-row two-cols">
        <div className="form-group">
          <label>HCP Name</label>
          <input type="text" name="hcp_name" placeholder="Search or select HCP..." value={formData.hcp_name} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Engagement Channel</label>
          <select name="interaction_type" value={formData.interaction_type} onChange={handleChange}>
            <option>Physical Meeting</option>
            <option>Virtual Call</option>
            <option>Email</option>
            <option>LinkedIn (Social)</option>
            <option>SMS</option>
            <option>Webinar</option>
            <option>Phone</option>
          </select>
        </div>
      </div>

      <div className="form-row two-cols">
        <div className="form-group">
          <label>Date</label>
          <input type="date" name="date" value={formData.date} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Time</label>
          <input type="time" name="time" value={formData.time} onChange={handleChange} />
        </div>
      </div>

      <div className="form-group">
        <label>Attendees</label>
        <input type="text" name="attendees" placeholder="Enter names or search..." value={formData.attendees} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Topics Discussed</label>
        <textarea name="topics" rows="3" placeholder="Enter key discussion points..." value={formData.topics} onChange={handleChange}></textarea>
        <button className="voice-btn">
          <Mic size={14} /> Summarize from Voice Note (Requires Consent)
        </button>
      </div>

      <div className="materials-section">
        <label className="section-subtitle">Materials Shared / Samples Distributed</label>
        
        <div className="material-box">
          <div className="material-box-header">
            <span>Materials Shared</span>
            <button className="action-btn"><Search size={14} /> Search/Add</button>
          </div>
          <div className="material-box-content">No materials added.</div>
        </div>

        <div className="material-box">
          <div className="material-box-header">
            <span>Samples Distributed</span>
            <button className="action-btn"><Plus size={14} /> Add Sample</button>
          </div>
          <div className="material-box-content">No samples added.</div>
        </div>
      </div>

      <div className="form-group sentiment-group">
        <label>Observed/Inferred HCP Sentiment</label>
        <div className="radio-group">
          <label className="radio-label">
            <input type="radio" name="sentiment" value="Positive" checked={formData.sentiment === 'Positive'} onChange={() => handleRadioChange('Positive')} />
            <span>😀 Positive</span>
          </label>
          <label className="radio-label">
            <input type="radio" name="sentiment" value="Neutral" checked={formData.sentiment === 'Neutral'} onChange={() => handleRadioChange('Neutral')} />
            <span>😐 Neutral</span>
          </label>
          <label className="radio-label">
            <input type="radio" name="sentiment" value="Negative" checked={formData.sentiment === 'Negative'} onChange={() => handleRadioChange('Negative')} />
            <span>😞 Negative</span>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label>Outcomes</label>
        <textarea name="outcomes" rows="2" placeholder="Key outcomes or agreements..." value={formData.outcomes} onChange={handleChange}></textarea>
      </div>

      <div className="form-group">
        <label>Follow-up Actions</label>
        <textarea name="follow_ups" rows="2" placeholder="Enter next steps or tasks..." value={formData.follow_ups} onChange={handleChange}></textarea>
      </div>

      <div className="omnichannel-section">
        <div className="section-header">Omnichannel & Hybrid Preferences</div>
        
        <div className="form-row two-cols">
          <div className="form-group">
            <label>HCP Preferred Channel</label>
            <select name="preferred_channel" value={formData.preferred_channel} onChange={handleChange}>
              <option value="Digital">Digital (Email/SMS/LinkedIn)</option>
              <option value="Face-to-Face">Face-to-Face (Field Visit)</option>
              <option value="Hybrid">Hybrid (Both)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Event Model</label>
            <select name="event_type" value={formData.event_type} onChange={handleChange}>
              <option value="Physical">Physical Only</option>
              <option value="Virtual">Virtual Only</option>
              <option value="Hybrid">Hybrid (Webinar + Physical)</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Reason for Channel Preference</label>
          <input type="text" name="channel_preference_reason" placeholder="e.g., Prefers LinkedIn for clinical updates..." value={formData.channel_preference_reason} onChange={handleChange} />
        </div>
      </div>

      <div className="ai-suggestions">
        <label>AI Suggested Follow-ups:</label>
        <ul>
          <li onClick={() => handleSuggestionClick("+ Schedule follow-up meeting in 2 weeks", "https://calendar.google.com/")}>+ Schedule follow-up meeting in 2 weeks</li>
          <li onClick={() => handleSuggestionClick("+ Send OncoBoost Phase III PDF", "https://www.nejm.org/search?q=oncology")}>+ Send OncoBoost Phase III PDF</li>
          <li onClick={() => handleSuggestionClick("+ Add to advisory board invite list", "https://www.linkedin.com/feed/")}>+ Add to advisory board invite list</li>
          {formData.next_best_action && (
            <li onClick={() => handleSuggestionClick(`+ ${formData.next_best_action}`)} style={{color: '#2563eb', fontWeight: 'bold'}}>
              + {formData.next_best_action} (Predicted Next Best Action)
            </li>
          )}
        </ul>
      </div>

      <div className="advanced-insights-grid">
        <div className="predictive-card">
          <div className="card-title"><TrendingUp size={14} /> Predictive Analytics</div>
          <div className="insight-row">
            <span className="insight-label">HCP Persona:</span>
            <span className="insight-value">{formData.hcp_persona}</span>
          </div>
          <div className="insight-row">
            <span className="insight-label">Best Channel:</span>
            <span className="insight-value">{formData.predicted_channel}</span>
          </div>
          <div className="insight-row">
            <span className="insight-label">Best Time:</span>
            <span className="insight-value">{formData.predicted_time}</span>
          </div>
        </div>

        <div className="predictive-card">
          <div className="card-title"><Zap size={14} /> Next-Best Action (NBA)</div>
          <div className="insight-row">
            <span className="insight-label">Suggested:</span>
            <span className="insight-value">{formData.next_best_action}</span>
          </div>
          <div className="insight-row">
            <span className="insight-label">ROI Potential:</span>
            <span className="insight-value" style={{color: '#059669'}}>{formData.roi_potential}</span>
          </div>
        </div>
      </div>

      <div className="content-library-section">
        <label className="section-subtitle">Hyper-Personalized Content Library</label>
        <div className="content-grid">
          <div className="content-item" onClick={() => handleSuggestionClick("+ Send Drug Mechanism (60s) video link", "https://www.youtube.com/results?search_query=drug+mechanism+animation")}>
            <div className="item-type"><Video size={12} /> Bite-Sized</div>
            <div className="item-name">Drug Mechanism (60s)</div>
          </div>
          <div className="content-item" onClick={() => handleSuggestionClick("+ Send Phase III Case Study PDF", "https://clinicaltrials.gov/")}>
            <div className="item-type"><FileText size={12} /> Evidence</div>
            <div className="item-name">Phase III Case Study</div>
          </div>
          <div className="content-item" onClick={() => handleSuggestionClick("+ Send Post-Launch RWE Report", "https://www.fda.gov/science-research/science-and-research-special-topics/real-world-evidence")}>
            <div className="item-type"><TrendingUp size={12} /> RWE</div>
            <div className="item-name">Post-Launch Report</div>
          </div>
        </div>
      </div>

      <div className="compliance-footer">
        <div className="compliance-badge">
          <ShieldCheck size={14} /> HIPAA & GDPR Compliant
        </div>
        <div style={{fontSize: '0.75rem', color: '#64748b'}}>Regulatory Standard: IFPMA v2026</div>
      </div>
    </div>
  );
};

const ChatInterface = () => {
  const [message, setMessage] = useState('');
  const dispatch = useDispatch();
  const { chatHistory, loading } = useSelector(state => state.interaction);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    const userMsg = { role: 'user', content: message };
    dispatch(addChatMessage(userMsg));
    dispatch(setLoading(true));
    setMessage('');

    try {
      const res = await axios.post(`${API_BASE_URL}/api/chat`, {
        message: userMsg.content,
        user_id: "rep_123",
        thread_id: "session_abc"
      });
      
      const reply = res.data.reply;
      
      // Robust JSON extraction
      let jsonStr = '';
      const jsonBlocks = reply.match(/```json\s*([\s\S]*?)\s*```/g);
      
      let mergedData = {};
      if (jsonBlocks) {
        jsonBlocks.forEach(block => {
          try {
            const cleanBlock = block.replace(/```json\s*|\s*```/g, '');
            const parsed = JSON.parse(cleanBlock);
            mergedData = { ...mergedData, ...parsed };
          } catch (e) {
            console.error("Failed to parse a JSON block", e);
          }
        });
      }

      // Fallback for plain JSON if no markdown blocks found
      if (Object.keys(mergedData).length === 0) {
        const plainJsonMatch = reply.match(/\{[\s\S]*?\}/);
        if (plainJsonMatch) {
          try {
            mergedData = JSON.parse(plainJsonMatch[0]);
          } catch (e) {}
        }
      }

      if (Object.keys(mergedData).length > 0) {
        const formFields = [
          'hcp_name', 'interaction_type', 'date', 'time', 'attendees', 'topics', 
          'sentiment', 'outcomes', 'follow_ups', 'preferred_channel', 
          'channel_preference_reason', 'is_hybrid_event', 'event_type', 'engagement_channel',
          'hcp_persona', 'next_best_action', 'predicted_channel', 'predicted_time',
          'compliance_check', 'roi_potential'
        ];
        const hasFormField = Object.keys(mergedData).some(key => formFields.includes(key));
        
        if (hasFormField) {
          dispatch(updateFormData(mergedData));
        }
      }

      // Extract clean text (removing the JSON block and backticks)
      const cleanReply = reply
        .replace(/```json[\s\S]*?```/g, '')
        .replace(/\{[^{}]*?"hcp_name"[\s\S]*?\}/g, '') // Target the specific JSON block with a key
        .replace(/\{[\s\S]*?\}/, '') // Fallback for any other small JSON block
        .trim();

      if (cleanReply) {
        dispatch(addChatMessage({ role: 'bot', content: cleanReply }));
      } else {
        dispatch(addChatMessage({ role: 'bot', content: "I've processed your request." }));
      }
    } catch (err) {
      dispatch(addChatMessage({ role: 'bot', content: 'Error communicating with AI agent.' }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-title">
          <Bot size={18} className="bot-icon" /> AI Assistant
        </div>
        <div className="chat-subtitle">Log interaction via chat</div>
      </div>
      
      <div className="chat-messages">
        <div className="chat-message bot example-msg">
          <div className="content">
            Log interaction details here (e.g., "Met Dr. Smith, discussed Product X efficacy, positive sentiment, shared brochure") or ask for help.
          </div>
        </div>
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.role}`}>
            <div className="content">
              {msg.role === 'bot' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
            </div>
          </div>
        ))}
        {loading && (
            <div className="chat-message bot loading">
                <div className="content"><Loader2 className="spinner" size={14} /> Processing...</div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-wrapper">
        <input 
          type="text" 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Describe interaction..."
        />
        <button onClick={handleSend} disabled={loading} className="log-btn">
           <Send size={14} /> Log
        </button>
      </div>
    </div>
  );
};

export default LogInteractionScreen;
