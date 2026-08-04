import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Single chat message bubble.
 * Supports markdown rendering for assistant messages.
 */
function Message({ role, content, timestamp }) {
  const isUser = role === 'user';
  const time = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`message message--${isUser ? 'user' : 'assistant'}`} role="listitem">
      {/* Avatar */}
      <div className="message__avatar" aria-hidden="true">
        {isUser ? '👤' : '🏨'}
      </div>

      <div className="message__body">
        <div className="message__bubble">
          {isUser ? (
            <p className="message__text">{content}</p>
          ) : (
            <div className="message__markdown">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>
        {time && (
          <span className="message__time" aria-label={`Sent at ${time}`}>
            {time}
          </span>
        )}
      </div>
    </div>
  );
}

export default Message;
