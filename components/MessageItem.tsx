
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Volume2, Languages, Copy, Check, StopCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Message } from '../types';
import { THEMES } from '../utils/theme';
import { sendFeedback } from '../services/geminiService';

interface MessageItemProps {
  message: Message;
  accentColor?: string;
  onFeedback?: (messageId: string, type: 'like' | 'dislike') => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, accentColor = 'red', onFeedback }) => {
  const isUser = message.role === 'user';
  const theme = THEMES[accentColor] || THEMES.red;
  
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(message.text);
    utterance.lang = 'tr-TR'; // Prefer Turkish
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleTranslate = () => {
    // Simple translation: Open Google Translate in a new tab with the text
    const url = `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(message.text)}&op=translate`;
    window.open(url, '_blank');
  };

  const handleFeedbackAction = (type: 'like' | 'dislike') => {
    if (!onFeedback) return;
    
    // Call the parent handler to update state persistence
    onFeedback(message.id, type);
    
    // Send analytics/feedback to service
    sendFeedback(message.id, type, message.text.substring(0, 50));
  };

  return (
    <div className={`flex items-start gap-3 flex-row ${isUser ? 'justify-end' : ''} animate-fade-in`}>
      {/* Avatar */}
      {!isUser && (
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${theme.bubbleAi} border ${theme.bubbleAiBorder}`}>
           <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8"></path>
            <rect width="16" height="12" x="4" y="8" rx="2"></rect>
            <path d="M2 14h2"></path>
            <path d="M20 14h2"></path>
            <path d="M15 13v2"></path>
            <path d="M9 13v2"></path>
          </svg>
        </div>
      )}

      <div className={`relative group flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
        <div 
          className={`px-4 py-3 rounded-2xl text-sm md:text-base overflow-hidden ${
            isUser 
              ? 'bg-gray-800 text-white rounded-br-none' 
              : `${theme.bubbleAi} text-white rounded-bl-none shadow-sm ${theme.bubbleAiShadow}`
          }`}
        >
          {/* Image Display */}
          {message.image && (
            <div className="mb-3 -mx-4 -mt-3">
              <img 
                src={message.image} 
                alt="User upload" 
                className="w-full h-auto max-h-64 object-cover" 
              />
            </div>
          )}

          <div className="prose prose-invert prose-sm max-w-none break-words whitespace-pre-wrap">
            <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>
          <span className="text-[10px] block text-right mt-1 opacity-60 select-none">
            {formattedTime}
          </span>
        </div>

        {/* Action Buttons (Only for AI) */}
        {!isUser && (
          <div className="mt-2 flex items-center gap-1 transition-opacity opacity-0 group-hover:opacity-100">
            <button 
              onClick={handleSpeak}
              className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors" 
              aria-label={isSpeaking ? "Durdur" : "Yazıyı Seslendir"}
              title={isSpeaking ? "Durdur" : "Seslendir"}
            >
              {isSpeaking ? <StopCircle size={16} className="text-red-500 animate-pulse" /> : <Volume2 size={16} />}
            </button>
            
            <button 
              onClick={handleTranslate}
              className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors" 
              aria-label="Google Translate'de Aç"
              title="Google Translate'de Aç"
            >
              <Languages size={16} />
            </button>

            <button 
              onClick={handleCopy}
              className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors" 
              aria-label="Kopyala"
              title="Kopyala"
            >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>

            <div className="w-px h-4 bg-gray-800 mx-1"></div>

            <button 
              onClick={() => handleFeedbackAction('like')}
              className={`p-1.5 rounded-full hover:bg-gray-800 transition-colors ${message.feedback === 'like' ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}
              aria-label="Beğen"
              title="Beğen"
            >
              <ThumbsUp size={16} className={message.feedback === 'like' ? 'fill-current' : ''} />
            </button>

            <button 
              onClick={() => handleFeedbackAction('dislike')}
              className={`p-1.5 rounded-full hover:bg-gray-800 transition-colors ${message.feedback === 'dislike' ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
              aria-label="Beğenme"
              title="Beğenme"
            >
              <ThumbsDown size={16} className={message.feedback === 'dislike' ? 'fill-current' : ''} />
            </button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-700">
          <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
      )}
    </div>
  );
};
