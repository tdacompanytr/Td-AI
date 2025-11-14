import React, { useState, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Volume2, Languages, Copy, Check, StopCircle, ThumbsUp, ThumbsDown, Terminal, Bookmark } from 'lucide-react';
import { Message } from '../types';
import { THEMES } from '../utils/theme';
import { sendFeedback } from '../services/geminiService';

interface MessageItemProps {
  message: Message;
  accentColor?: string;
  onFeedback?: (messageId: string, type: 'like' | 'dislike') => void;
  onSave?: (text: string) => void;
  fontSize?: 'normal' | 'large' | 'xl';
  typingEffect?: boolean;
  showAvatars?: boolean;
  timeFormat?: '12h' | '24h';
  customUsername?: string;
  latency?: number;
}

export const MessageItem: React.FC<MessageItemProps> = ({ 
  message, 
  accentColor = 'red', 
  onFeedback, 
  onSave,
  fontSize = 'normal',
  typingEffect = true,
  showAvatars = true,
  timeFormat = '24h',
  customUsername = 'Sen',
  latency
}) => {
  const isUser = message.role === 'user';
  const theme = THEMES[accentColor] || THEMES.red;
  
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Typing animation state
  const [displayedText, setDisplayedText] = useState(isUser || !typingEffect ? message.text : '');
  const [isTypingComplete, setIsTypingComplete] = useState(isUser || !typingEffect);

  // Smoother random animation duration
  const animationDuration = useMemo(() => `${0.4 + Math.random() * 0.2}s`, []);

  // Get Text Size Class
  const textSizeClass = useMemo(() => {
    switch (fontSize) {
      case 'large': return 'text-base md:text-lg';
      case 'xl': return 'text-lg md:text-xl';
      default: return 'text-sm md:text-base';
    }
  }, [fontSize]);

  // Typing effect logic
  useEffect(() => {
    if (isUser || !typingEffect) {
      setDisplayedText(message.text);
      setIsTypingComplete(true);
      return;
    }

    // Reset for new message
    setDisplayedText('');
    setIsTypingComplete(false);

    const fullText = message.text;
    const textLength = fullText.length;

    if (textLength === 0) {
      setIsTypingComplete(true);
      return;
    }

    // Optimized typing speed calculation for fluidity
    const totalDuration = Math.min(2500, Math.max(600, textLength * 15));
    const intervalTime = totalDuration / textLength;

    let currentIndex = 0;
    const timer = setInterval(() => {
      currentIndex++;
      setDisplayedText(fullText.substring(0, currentIndex));

      if (currentIndex >= textLength) {
        clearInterval(timer);
        setIsTypingComplete(true);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [message.id, message.text, isUser, typingEffect]);

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: timeFormat === '12h'
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(message.text);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(message.text);
    utterance.lang = 'tr-TR'; 
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleTranslate = () => {
    const url = `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(message.text)}&op=translate`;
    window.open(url, '_blank');
  };

  const handleFeedbackAction = (type: 'like' | 'dislike') => {
    if (!onFeedback) return;
    onFeedback(message.id, type);
    sendFeedback(message.id, type, message.text.substring(0, 50));
  };

  // --- Custom Markdown Components ---
  const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'text';
    const codeContent = String(children).replace(/\n$/, '');
    const [isCodeCopied, setIsCodeCopied] = useState(false);

    const handleCodeCopy = () => {
      navigator.clipboard.writeText(codeContent);
      setIsCodeCopied(true);
      setTimeout(() => setIsCodeCopied(false), 2000);
    };

    if (!inline && match) {
      return (
        <div className={`my-3 md:my-5 rounded-xl overflow-hidden border ${theme.border} border-opacity-30 bg-[#1e1e1e] shadow-2xl group/code relative w-full transition-all hover:border-opacity-50`}>
          <div className={`flex items-center justify-between px-3 py-2 md:px-4 md:py-2.5 bg-gray-900/80 border-b ${theme.border} border-opacity-20 select-none backdrop-blur-sm`}>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5 opacity-70 group-hover/code:opacity-100 transition-opacity">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/50 transition-transform hover:scale-110"></div>
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/50 transition-transform hover:scale-110"></div>
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/50 transition-transform hover:scale-110"></div>
              </div>
              <span className={`ml-2 text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider ${theme.iconBg} ${theme.text} px-2 py-0.5 rounded flex items-center gap-1.5 border ${theme.border} border-opacity-30`}>
                <Terminal size={10} />
                {language}
              </span>
            </div>
            <button
              onClick={handleCodeCopy}
              className={`flex items-center gap-1.5 text-[10px] md:text-xs font-medium text-gray-400 hover:${theme.text} transition-all bg-gray-800/50 hover:bg-gray-700 px-2 py-1 md:px-2.5 md:py-1.5 rounded-md border border-transparent hover:${theme.border} hover:border-opacity-30 active:scale-95`}
            >
              {isCodeCopied ? (
                <>
                  <Check size={12} className="text-green-500" />
                  <span className="text-green-500 hidden md:inline">Kopyalandı</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span className="hidden md:inline">Kopyala</span>
                </>
              )}
            </button>
          </div>
          <div className="text-xs md:text-sm overflow-x-auto relative custom-scrollbar">
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={language}
              PreTag="div"
              showLineNumbers={true}
              wrapLines={true}
              lineNumberStyle={{ minWidth: '2em', paddingRight: '0.5em', color: '#6e7681', textAlign: 'right', borderRight: '1px solid #333', marginRight: '0.5em', display: window.innerWidth < 600 ? 'none' : 'block' }}
              customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: 'inherit', lineHeight: '1.5' }}
              {...props}
            >
              {codeContent}
            </SyntaxHighlighter>
          </div>
        </div>
      );
    }

    return (
      <code className={`${inline ? `bg-gray-800/80 px-1.5 py-0.5 rounded text-xs md:text-sm font-mono ${theme.textHighlight} border border-gray-700/50 whitespace-pre-wrap break-all` : 'block bg-gray-900 p-3 md:p-4 rounded-lg overflow-x-auto font-mono text-xs md:text-sm'}`} {...props}>
        {children}
      </code>
    );
  };

  return (
    <div 
      className={`flex items-start gap-2 md:gap-3 flex-row ${isUser ? 'justify-end' : ''} animate-slide-up-fade group/message opacity-0`}
      style={{ animationDuration }}
    >
      {/* Avatar - Hidden if showAvatars is false */}
      {!isUser && showAvatars && (
        <div className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center overflow-hidden ${theme.bubbleAi} border ${theme.bubbleAiBorder} shadow-lg mt-1 transition-transform hover:scale-105`}>
           <svg className="w-4 h-4 md:w-5 md:h-5 text-white" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8"></path>
            <rect width="16" height="12" x="4" y="8" rx="2"></rect>
            <path d="M2 14h2"></path>
            <path d="M20 14h2"></path>
            <path d="M15 13v2"></path>
            <path d="M9 13v2"></path>
          </svg>
        </div>
      )}

      <div className={`relative flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[90%] md:max-w-[85%] lg:max-w-[75%]`}>
        
        {/* Sender Name (Optional/Hover) */}
        <div className={`text-[10px] text-gray-500 mb-1 px-1 font-medium tracking-wide transition-opacity ${isUser ? 'text-right' : 'text-left'} ${showAvatars ? 'block' : 'hidden group-hover/message:block'}`}>
          {isUser ? customUsername : 'Td AI'}
        </div>

        <div 
          className={`px-4 py-3 md:px-5 md:py-4 rounded-2xl ${textSizeClass} overflow-hidden shadow-md border transition-all duration-300 hover:shadow-lg ${
            isUser 
              ? `${theme.bubbleUser} text-white rounded-br-none ${theme.userBubbleBorder}` 
              : `${theme.bubbleAi} text-white rounded-bl-none ${theme.bubbleAiBorder} ${theme.bubbleAiShadow}`
          }`}
        >
          {/* Media Display */}
          {message.image && (
            <div className="mb-3 md:mb-4 -mx-4 -mt-3 md:-mx-5 md:-mt-4 rounded-t-2xl overflow-hidden relative group/media">
              {message.mediaType === 'video' ? (
                <video src={message.image} controls className="w-full h-auto max-h-80 object-contain bg-black/40" />
              ) : (
                <>
                   <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/10 transition-colors"></div>
                   <img src={message.image} alt="Görsel" className="w-full h-auto max-h-80 object-contain bg-black/20" />
                </>
              )}
            </div>
          )}

          <div className="prose prose-invert prose-sm max-w-none break-words leading-relaxed min-h-[1.5rem] w-full">
            <ReactMarkdown
              components={{
                code: CodeBlock,
                a: ({ node, ...props }) => (
                  <a target="_blank" rel="noopener noreferrer" className={`font-semibold underline decoration-2 underline-offset-2 ${theme.text} hover:opacity-80 transition-opacity break-all`} {...props} />
                ),
                p: ({ node, ...props }) => <p className="mb-2 md:mb-3 last:mb-0 break-words" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                em: ({ node, ...props }) => <em className="italic text-gray-300" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-4 md:pl-6 my-2 md:my-3 space-y-1 marker:text-gray-400" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 md:pl-6 my-2 md:my-3 space-y-1 marker:text-gray-400" {...props} />,
                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                h1: ({ node, ...props }) => <h1 className="text-xl md:text-2xl font-bold mt-4 md:mt-6 mb-2 md:mb-3 pb-2 border-b border-gray-700/50 text-white" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-lg md:text-xl font-bold mt-3 md:mt-5 mb-2 text-gray-100" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-base md:text-lg font-semibold mt-3 md:mt-4 mb-1.5 text-gray-200" {...props} />,
                blockquote: ({ node, ...props }) => <blockquote className={`border-l-4 ${theme.border} pl-3 md:pl-4 my-3 md:my-4 italic text-gray-400 bg-gray-900/30 py-2 rounded-r-lg text-sm`} {...props} />,
                table: ({ node, ...props }) => <div className={`w-full overflow-x-auto my-3 md:my-5 rounded-lg border ${theme.border} border-opacity-30 shadow-sm`}><table className="min-w-full divide-y divide-gray-700 text-left text-xs md:text-sm border-collapse" {...props} /></div>,
                thead: ({ node, ...props }) => <thead className="bg-gray-800/80" {...props} />,
                tbody: ({ node, ...props }) => <tbody className="divide-y divide-gray-800 bg-gray-900/50" {...props} />,
                tr: ({ node, ...props }) => <tr className="hover:bg-gray-800/50 transition-colors even:bg-gray-800/20" {...props} />,
                th: ({ node, ...props }) => <th className={`px-3 py-2 md:px-4 md:py-3 font-semibold ${theme.textHighlight} uppercase text-[10px] md:text-xs tracking-wider border-b border-gray-700`} {...props} />,
                td: ({ node, ...props }) => <td className="px-3 py-2 md:px-4 md:py-3 border-t border-gray-800/50 whitespace-pre-wrap" {...props} />,
                hr: ({ node, ...props }) => <hr className="my-4 md:my-6 border-gray-700/50" {...props} />,
              }}
            >
              {displayedText}
            </ReactMarkdown>
            {!isTypingComplete && !isUser && typingEffect && (
              <span className={`inline-block w-1.5 h-3.5 md:h-4 align-middle ml-1 ${theme.primary} animate-pulse`}></span>
            )}
          </div>
          
          <div className="flex justify-between items-end mt-1 md:mt-2">
            {/* Latency Indicator (If enabled and exists) */}
            {latency && !isUser && (
              <span className="text-[9px] text-gray-600 font-mono opacity-60 animate-fade-in">
                 {latency}ms
              </span>
            )}
            <span className={`text-[9px] md:text-[10px] opacity-50 select-none font-medium tracking-wide ml-auto`}>
              {formattedTime}
            </span>
          </div>
        </div>

        {/* User Actions */}
        {isUser && (
          <div className={`mt-1 mr-1 flex items-center gap-1 transition-all duration-300 ${copied || saved ? 'opacity-100' : 'opacity-0 group-hover/message:opacity-100'}`}>
            <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all active:scale-90" title="Kopyala">
              {copied ? <Check size={14} className="text-green-500 animate-scale-in" /> : <Copy size={14} />}
            </button>
            <button onClick={handleSave} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all active:scale-90" title="Kaydet">
              {saved ? <Check size={14} className="text-green-500 animate-scale-in" /> : <Bookmark size={14} />}
            </button>
          </div>
        )}

        {/* Action Buttons (AI) */}
        {!isUser && (
          <div className={`mt-1.5 md:mt-2 ml-1 flex items-center gap-1 transition-all duration-300 ${isTypingComplete ? 'opacity-0 group-hover/message:opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <button onClick={handleSpeak} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all active:scale-90" title={isSpeaking ? "Durdur" : "Seslendir"}>
              {isSpeaking ? <StopCircle size={14} className="text-red-500 animate-pulse" /> : <Volume2 size={14} />}
            </button>
            <button onClick={handleTranslate} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all active:scale-90" title="Google Translate'de Aç"><Languages size={14} /></button>
            <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all active:scale-90" title="Tümünü Kopyala">
                {copied ? <Check size={14} className="text-green-500 animate-scale-in" /> : <Copy size={14} />}
            </button>
            <button onClick={handleSave} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all active:scale-90" title="Kaydedilenlere Ekle">
                {saved ? <Check size={14} className="text-green-500 animate-scale-in" /> : <Bookmark size={14} />}
            </button>
            <div className="w-px h-3 md:h-4 bg-gray-800 mx-1"></div>
            <button onClick={() => handleFeedbackAction('like')} className={`p-1.5 rounded-lg hover:bg-gray-800 transition-all active:scale-90 ${message.feedback === 'like' ? 'text-green-500 bg-green-500/10' : 'text-gray-400 hover:text-green-500'}`}><ThumbsUp size={14} className={message.feedback === 'like' ? 'fill-current' : ''} /></button>
            <button onClick={() => handleFeedbackAction('dislike')} className={`p-1.5 rounded-lg hover:bg-gray-800 transition-all active:scale-90 ${message.feedback === 'dislike' ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-red-500'}`}><ThumbsDown size={14} className={message.feedback === 'dislike' ? 'fill-current' : ''} /></button>
          </div>
        )}
      </div>

      {/* User Avatar - Hidden if showAvatars is false */}
      {isUser && showAvatars && (
        <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-700 shadow-sm mt-1 transition-transform hover:scale-105">
          <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
      )}
    </div>
  );
};