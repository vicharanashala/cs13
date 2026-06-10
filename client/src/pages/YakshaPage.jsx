import { useState, useEffect, useRef } from 'react';
import { yakshaChat } from '../api';

const recentConversations = [
  { title: 'NOC application timeline', meta: '2 hours ago' },
  { title: 'Resume review for internships', meta: 'Yesterday' },
  { title: 'Stipend eligibility check', meta: '3 days ago' },
  { title: 'Interview prep for CS roles', meta: 'Last week' },
];

const suggestedTopics = [
  'Eligibility criteria for Samagama',
  'Stipend and remote internship details',
  'Resume tips for research internships',
  'Mock interview question practice',
  'Career roadmap for CS students',
];

const quickPrompts = [
  'Resume Review',
  'Interview Preparation',
  'Internship Eligibility',
  'NOC Questions',
  'Stipend Queries',
  'Certificate Support',
];

const assistantFeatures = [
  'Internship Guidance',
  'Resume Feedback',
  'Interview Prep',
  'Career Roadmaps',
  'FAQ Help',
];

function formatTime(date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function YakshaPage() {
  const chatWindowRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: 'Namaste! I am Zoro, your AI guide for the Vicharanashala Internship programme. Ask me anything about the program or internship prep.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, loading, error]);

  // Build the messages array for the API — only keep user/ai roles
  const buildApiMessages = (currentMessages) =>
    currentMessages
      .filter(m => m.role === 'user' || m.role === 'ai')
      .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setError('');

    // Optimistically append user message
    const userMessage = { role: 'user', text, time: formatTime(new Date()) };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Build the history to send to the API
    const historyMessages = buildApiMessages(newMessages);

    try {
      const data = await yakshaChat(historyMessages);

      if (data.error) {
        // Show graceful error and keep user message visible
        const errorText =
          data.error === 'Groq API key not configured on server'
            ? 'AI is not configured yet. Please ask the admin to add the GROQ_API_KEY to the server .env file.'
            : data.error === 'Invalid or expired token'
            ? 'Your session expired. Please log out and log in again.'
            : `Zoro is unavailable: ${data.error}`;

        setError(errorText);
        // Remove the optimistic user message on error to avoid confusion
        setMessages(prev => prev.slice(0, -1));
      } else if (data.reply) {
        // Append the AI response
        setMessages(prev => [
          ...prev,
          { role: 'ai', text: data.reply, time: formatTime(new Date()) },
        ]);
      } else {
        throw new Error('Unexpected response');
      }
    } catch (err) {
      setError('Could not reach Zoro. Please check your connection and try again.');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function startNewChat() {
    setMessages([
      {
        role: 'ai',
        text: 'Namaste! I am Zoro, your AI guide for the Vicharanashala Internship programme. Ask me anything about the program or internship prep.',
      },
    ]);
    setInput('');
    setError('');
    setLoading(false);
  }

  return (
    <div className="yaksha-page">
      <section className="yaksha-hero leaderboard-surface">
        <div className="yaksha-hero-main">
          <div className="yaksha-avatar" aria-hidden="true">
            ✦
          </div>
          <div className="yaksha-hero-copy">
            <p className="page-label">Zoro</p>
            <h1>Your personal AI companion for Samagama.</h1>
            <p>
              Ask anything about internships, NOC, stipends, certificates, interviews, resumes, and career guidance.
            </p>
          </div>
        </div>

        <div className="yaksha-hero-meta">
          {assistantFeatures.map(feature => (
            <span key={feature} className="yaksha-feature-pill">
              {feature}
            </span>
          ))}
        </div>
      </section>

      <div className="yaksha-shell">
        <aside className="yaksha-sidebar leaderboard-surface">
          <button className="new-chat-btn" onClick={startNewChat} type="button">
            <span>＋</span>
            New Chat
          </button>

          <div className="sidebar-section">
            <div className="sidebar-heading">
              <span className="sidebar-label">Recent Conversations</span>
            </div>
            <div className="sidebar-list">
              {recentConversations.map(item => (
                <button
                  key={item.title}
                  className="sidebar-item chat-item"
                  type="button"
                  onClick={() => setInput(item.title)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-heading">
              <span className="sidebar-label">Suggested Topics</span>
            </div>
            <div className="sidebar-list topic-list">
              {suggestedTopics.map(item => (
                <button
                  key={item}
                  onClick={() => setInput(item)}
                  type="button"
                  className="sidebar-item topic-item"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section feature-section">
            <div className="sidebar-heading">
              <span className="sidebar-label">AI Assistant Features</span>
            </div>
            <div className="feature-list">
              {assistantFeatures.map(feature => (
                <div key={feature} className="feature-mini-card">
                  <span className="feature-mini-dot" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="chat-panel leaderboard-surface">
          <div className="chat-window" ref={chatWindowRef}>
            {messages.length === 1 && (
              <div className="yaksha-empty-state">
                <div className="empty-intro">
                  <div className="empty-avatar" aria-hidden="true">
                    AI
                  </div>
                  <div>
                    <h2>Start a conversation</h2>
                    <p>Choose a quick prompt or ask Zoro anything to begin.</p>
                  </div>
                </div>

                <div className="quick-prompts">
                  {quickPrompts.map(prompt => (
                    <button
                      key={prompt}
                      type="button"
                      className="quick-prompt-card"
                      onClick={() => setInput(prompt)}
                    >
                      <strong>{prompt}</strong>
                      <span>Tap to ask Zoro</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`chat-row ${message.role}`}>
                <div className={`chat-bubble ${message.role}`}>
                  <div className="bubble-top">
                    <span className="bubble-name">
                      {message.role === 'ai' ? 'Zoro' : 'You'}
                    </span>
                    <span className="bubble-time">{message.time || 'Just now'}</span>
                  </div>
                  <p>{message.text}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-row ai">
                <div className="chat-bubble ai">
                  <div className="bubble-top">
                    <span className="bubble-name">Zoro</span>
                    <span className="bubble-time">Thinking…</span>
                  </div>
                  <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                    Zoro is thinking…
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="chat-row ai">
                <div className="chat-bubble ai" style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}>
                  <div className="bubble-top">
                    <span className="bubble-name">Zoro</span>
                    <span className="bubble-time" style={{ color: '#ef4444' }}>⚠ Error</span>
                  </div>
                  <p style={{ color: '#ef4444' }}>{error}</p>
                </div>
              </div>
            )}
            <div style={{ height: '1rem' }} />
          </div>

          <div className="chat-composer">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Zoro anything..."
              rows="2"
              disabled={loading}
            />
            <button
              className="primary-btn send-btn"
              onClick={sendMessage}
              type="button"
              disabled={loading || !input.trim()}
            >
              {loading ? 'Sending…' : 'Send'}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default YakshaPage;