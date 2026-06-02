import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CopilotPanelProps {
  userId: string;
  targetRole?: string;
  onClose?: () => void;
}

export const ReadinessCopilotPanel: React.FC<CopilotPanelProps> = ({ userId, targetRole, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingContent('');

    try {
      // Call AI conversation service
      const response = await fetch('/api/ai/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          targetRole,
          question: userMessage.content,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          setStreamingContent(prev => prev + chunk);
        }
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: streamingContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearConversation = () => {
    setMessages([]);
  };

  return (
    <div className="readiness-copilot-panel">
      <div className="copilot-header">
        <h3>Engineering Progression Mentor</h3>
        <div className="copilot-actions">
          <button onClick={clearConversation} className="clear-btn">
            Clear
          </button>
          {onClose && (
            <button onClick={onClose} className="close-btn">
              Close
            </button>
          )}
        </div>
      </div>

      <div className="copilot-messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <p>Ask me about your engineering readiness, roadmap progression, or technical growth.</p>
            <div className="example-questions">
              <button
                onClick={() => setInput('Why is my backend readiness low?')}
                className="example-question"
              >
                Why is my backend readiness low?
              </button>
              <button
                onClick={() => setInput('What blocks my 20 LPA backend target?')}
                className="example-question"
              >
                What blocks my 20 LPA backend target?
              </button>
              <button
                onClick={() => setInput('Why is Redis before Kubernetes?')}
                className="example-question"
              >
                Why is Redis before Kubernetes?
              </button>
              <button
                onClick={() => setInput('Which project improves backend maturity most?')}
                className="example-question"
              >
                Which project improves backend maturity most?
              </button>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.role}`}
          >
            <div className="message-content">
              <div className="message-role">
                {message.role === 'user' ? 'You' : 'AI Mentor'}
              </div>
              <div className="message-text">{message.content}</div>
              <div className="message-timestamp">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isStreaming && streamingContent && (
          <div className="message assistant streaming">
            <div className="message-content">
              <div className="message-role">AI Mentor</div>
              <div className="message-text">{streamingContent}</div>
            </div>
          </div>
        )}

        {isLoading && !streamingContent && (
          <div className="message assistant loading">
            <div className="message-content">
              <div className="message-role">AI Mentor</div>
              <div className="loading-indicator">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="copilot-input">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about your engineering readiness..."
          disabled={isLoading}
          rows={3}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="send-btn"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>

      <style>{`
        .readiness-copilot-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .copilot-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .copilot-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }

        .copilot-actions {
          display: flex;
          gap: 8px;
        }

        .clear-btn,
        .close-btn {
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          color: #374151;
        }

        .clear-btn:hover,
        .close-btn:hover {
          background: #f3f4f6;
        }

        .copilot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .empty-state {
          text-align: center;
          padding: 32px 16px;
          color: #6b7280;
        }

        .empty-state p {
          margin-bottom: 24px;
        }

        .example-questions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
        }

        .example-question {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 16px;
          cursor: pointer;
          font-size: 13px;
          color: #374151;
          max-width: 300px;
        }

        .example-question:hover {
          background: #f3f4f6;
        }

        .message {
          display: flex;
          gap: 8px;
        }

        .message.user {
          flex-direction: row-reverse;
        }

        .message-content {
          max-width: 80%;
          padding: 12px;
          border-radius: 8px;
        }

        .message.user .message-content {
          background: #3b82f6;
          color: white;
        }

        .message.assistant .message-content {
          background: #f3f4f6;
          color: #111827;
        }

        .message.streaming .message-content {
          background: #e5e7eb;
        }

        .message-role {
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 4px;
          opacity: 0.8;
        }

        .message-text {
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .message-timestamp {
          font-size: 10px;
          margin-top: 4px;
          opacity: 0.6;
        }

        .loading-indicator {
          display: flex;
          gap: 4px;
        }

        .loading-indicator span {
          animation: blink 1.4s infinite both;
        }

        .loading-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .loading-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes blink {
          0%, 80%, 100% {
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
        }

        .copilot-input {
          display: flex;
          gap: 8px;
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .copilot-input textarea {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          resize: none;
          font-size: 14px;
          font-family: inherit;
        }

        .copilot-input textarea:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .copilot-input textarea:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }

        .send-btn {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .send-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .send-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
