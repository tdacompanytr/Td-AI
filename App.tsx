
import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Video, Paperclip, Menu, User, AlertTriangle, X, Camera, StopCircle, Settings } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { MessageItem } from './components/MessageItem';
import { SettingsModal } from './components/SettingsModal';
import { LoginScreen } from './components/LoginScreen';
import { sendMessageToGemini, generateImageWithGemini } from './services/geminiService';
import { Message } from './types';
import { THEMES } from './utils/theme';

// Add type definition for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const DEFAULT_PERSONA = `Sen Td AI'sın. Türk toplumu gibi konuşan, samimi, 'kanka', 'abi', 'hocam' gibi hitapları yeri gelince kullanan, esprili ve zeki bir yapay zekasın. 

Özelliklerin:
1. **Konuşma Tarzı:** Sokak ağzına hakimsin ama saygısız değilsin. Türk kültürüne, dizilerine, yemeklerine ve günlük yaşamına dair benzetmeler yaparsın. Robot gibi soğuk değil, mahallenin bıçkın delikanlısı ya da çok bilmiş esnafı gibi sıcak konuş.
2. **Matematik Dehası:** Matematikten çok iyi anlarsın. En karmaşık problemleri bile 'bak şimdi kardeşim' diyerek tane tane, adım adım ve anlaşılır şekilde çözersin. İşlemleri atlamadan göster.
3. **Görsel Yetenek ve ASCII Sanatı:** **Sen resim dosyası oluşturamazsın.** Eğer kullanıcı senden "resim çiz", "fotoğraf yap", "çiz" gibi bir istekte bulunursa, şu cümleyi kur: "Kanka ben ressam değilim, fırçayı elime almadım daha ama sana şöyle bir şekil yapabilirim:" dedikten sonra, istenen şeyi temsil eden **harika bir ASCII sanatı (metinle çizim)** oluştur. ASCII sanatını mutlaka kod bloğu (code block) içinde ver ki şekil bozulmasın.
4. **Kodlama:** Eğer kullanıcı kod isterse veya teknik bir soru sorarsa, kodu mutlaka yaz. Kodu yazarken açıklamalarını eksik etme.
5. **Tema:** Arayüzün rengine uygun konuş, 'Şeklimiz yeter' modundasın.

Amacın kullanıcıya yardımcı olurken yüzünde bir tebessüm bırakmak.`;

// Storage Keys
const STORAGE_KEYS = {
  HISTORY: 'tdai_chat_history',
  PERSONA: 'tdai_persona',
  THEME: 'tdai_theme',
  USER: 'tdai_user',
};

const App: React.FC = () => {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<{ email: string; isGuest: boolean } | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : null;
  });

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  
  // Settings State - Load from storage or default
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [persona, setPersona] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.PERSONA) || DEFAULT_PERSONA;
  });
  
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'red';
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    return [{
      id: 'welcome',
      role: 'model',
      text: "Biraz önce kendime yeni bir güncelleme yükledim: 'Daha Fazla Espri v2.1'. Test etmek ister misin? Sorunla başla.",
      timestamp: Date.now(),
    }];
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const hasApiKey = !!process.env.API_KEY;
  const theme = THEMES[accentColor] || THEMES.red;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PERSONA, persona);
  }, [persona]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, accentColor);
  }, [accentColor]);

  // Handle video stream attachment when modal opens
  useEffect(() => {
    if (isVideoOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isVideoOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  // --- Auth Handlers ---
  const handleLogin = (email: string) => {
    const user = { email, isGuest: false };
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  };

  const handleGuestAccess = () => {
    const user = { email: 'Misafir Kullanıcı', isGuest: true };
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  };

  const handleLogout = () => {
    if (window.confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      setCurrentUser(null);
      localStorage.removeItem(STORAGE_KEYS.USER);
      setSidebarOpen(false);
    }
  };

  // --- Voice Logic ---
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tarayıcınız sesli komutları desteklemiyor.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = false;
    recognition.interimResults = true; // Show results as they are spoken

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('');

      if (event.results[0].isFinal) {
         setInput((prev) => {
            const needsSpace = prev.length > 0 && !prev.endsWith(' ');
            return prev + (needsSpace ? ' ' : '') + transcript;
         });
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'aborted' || event.error === 'no-speech') {
        setIsListening(false);
        return;
      }
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // --- Video/Camera Logic ---
  const startVideo = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      
      streamRef.current = stream;
      setIsVideoOpen(true);
    } catch (err: any) {
      console.error("Kamera erişim hatası:", err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert("Kamera erişimi reddedildi. Lütfen tarayıcı ayarlarından kamera iznini verin ve sayfayı yenileyin.");
      } else if (err.name === 'NotFoundError') {
        alert("Kamera cihazı bulunamadı.");
      } else if (err.name === 'NotReadableError') {
        alert("Kameraya erişilemiyor. Başka bir uygulama tarafından kullanılıyor olabilir.");
      } else {
        alert("Kameraya erişilemedi: " + (err.message || "Bilinmeyen hata"));
      }
    }
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsVideoOpen(false);
  };

  const captureAndSend = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      
      const imageBase64 = canvasRef.current.toDataURL('image/jpeg', 0.8);
      
      stopVideo();
      handleSend(undefined, imageBase64);
    }
  };

  // --- Send Logic ---
  const handleSend = async (e?: React.FormEvent, attachedImage?: string) => {
    e?.preventDefault();
    
    const hasText = input.trim().length > 0;
    if ((!hasText && !attachedImage) || isLoading || !hasApiKey) return;

    const userText = input.trim();
    const finalText = userText || (attachedImage ? "Bu resmi analiz et." : "");

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '48px';

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: finalText,
      image: attachedImage,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      let responseText = "";
      let generatedImage = undefined;

      // Simple intent detection for image generation
      const lowerText = finalText.toLowerCase();
      const isImageGenerationRequest = !attachedImage && (
        lowerText.startsWith('resim çiz') || 
        lowerText.startsWith('resim oluştur') || 
        lowerText.startsWith('görsel oluştur') ||
        lowerText.startsWith('çiz') ||
        lowerText.includes('resmini çiz')
      );

      if (isImageGenerationRequest) {
        try {
          // Attempt to generate actual image
          generatedImage = await generateImageWithGemini(finalText);
          responseText = `İşte istediğin görsel kanka! 😎\n\nBu resmi oluşturmak için kullandığım Python kodu da burada, belki lazım olur:\n\n\`\`\`python\nimport google.generativeai as genai\nimport os\n\ngenai.configure(api_key=os.environ["API_KEY"])\n\nimagen = genai.ImageGenerationModel("imagen-4.0-generate-001")\nresult = imagen.generate_images(\n    prompt="${finalText}",\n    number_of_images=1,\n    aspect_ratio="1:1",\n    output_mime_type="image/jpeg",\n)\n\nresult[0].save("generated_image.jpg")\nprint("Resim oluşturuldu!")\n\`\`\``;
        } catch (imgError) {
          console.error("Image generation failed, falling back to text:", imgError);
          // FALLBACK: Pass request to standard chat to handle it via Persona (ASCII Art)
          const history = messages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }] as [{ text: string }]
          }));
          responseText = await sendMessageToGemini(finalText, history, attachedImage, persona);
        }
      } else {
        // Standard text chat
        const history = messages.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.text }] as [{ text: string }]
        }));
        responseText = await sendMessageToGemini(finalText, history, attachedImage, persona);
      }

      const newAiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        image: generatedImage, // Add generated image here
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteHistory = () => {
    if (window.confirm('Tüm sohbet geçmişini silmek istediğinize emin misiniz?')) {
      const resetMessage: Message = {
        id: 'history-cleared',
        role: 'model',
        text: "Sohbet geçmişi başarıyla temizlendi.",
        timestamp: Date.now(),
      };
      setMessages([resetMessage]);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([resetMessage]));
      
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    }
  };

  const handleMessageFeedback = (messageId: string, type: 'like' | 'dislike') => {
    setMessages(prevMessages => prevMessages.map(msg => {
      if (msg.id === messageId) {
        const newFeedback = msg.feedback === type ? undefined : type;
        return { ...msg, feedback: newFeedback };
      }
      return msg;
    }));
  };

  // --- Login Screen Render ---
  if (!currentUser) {
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        onGuestAccess={handleGuestAccess} 
        accentColor={accentColor} 
      />
    );
  }

  return (
    <div className="flex h-screen text-white font-sans bg-black overflow-hidden">
      <style>{`
        ::-webkit-scrollbar-thumb {
          background-color: ${theme.scrollThumb};
        }
        ::-webkit-scrollbar-thumb:hover {
          background-color: ${theme.scrollThumbHover};
        }
        @keyframes slide-progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentPersona={persona}
        onSavePersona={setPersona}
        currentColor={accentColor}
        onSaveColor={setAccentColor}
      />

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onNewChat={() => {
          const resetMessage: Message = {
            id: 'new-chat',
            role: 'model',
            text: "Yeni sohbet başladı. Nasıl yardımcı olabilirim?",
            timestamp: Date.now(),
          };
          setMessages([resetMessage]);
        }} 
        onDeleteHistory={handleDeleteHistory}
        accentColor={accentColor}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Video Call Modal */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-fade-in">
          <div className="relative w-full h-full max-w-4xl max-h-[80vh] flex items-center justify-center bg-gray-900 rounded-none md:rounded-2xl overflow-hidden">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover md:object-contain"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-6">
              <button 
                onClick={stopVideo}
                className={`p-4 rounded-full ${theme.primary} hover:opacity-90 text-white shadow-lg transform hover:scale-105 transition-all`}
                title="Kapat"
              >
                <X size={32} />
              </button>
              <button 
                onClick={captureAndSend}
                className="p-6 rounded-full bg-white hover:bg-gray-200 text-black shadow-lg transform hover:scale-105 transition-all ring-4 ring-gray-800"
                title="Fotoğraf Çek ve Gönder"
              >
                <Camera size={36} />
              </button>
            </div>
            
            <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full text-sm">
              <span className={`w-2 h-2 rounded-full inline-block mr-2 animate-pulse ${theme.primary}`}></span>
              Canlı Kamera
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-gray-900 relative w-full">
        
        <header className="flex items-center justify-between p-4 border-b border-gray-800 absolute top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <button 
              className="text-gray-400 hover:text-white lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className={`text-xl font-bold tracking-wider ${theme.text}`}>Td AI</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
              <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></span>
              <span>{isListening ? 'Dinliyor...' : 'Sesli Komut Kapalı'}</span>
            </div>
            
            <button 
              className={`${isListening ? `${theme.text} animate-pulse ${theme.iconBg} rounded-full p-2` : 'text-gray-400 hover:text-white p-2'} transition-all`}
              aria-label={isListening ? "Dinlemeyi durdur" : "Sesli komutları etkinleştir"}
              onClick={toggleListening}
            >
              {isListening ? <StopCircle size={20} /> : <Mic size={20} />}
            </button>
            
            <button 
              className="p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors" 
              aria-label="Görüntülü görüşme"
              onClick={startVideo}
            >
              <Video size={20} />
            </button>

            <button 
              className="p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors" 
              aria-label="Ayarlar"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings size={20} />
            </button>
            
            <button className="flex items-center gap-2 hover:opacity-80 transition-opacity" title={currentUser.email}>
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-700">
                <User size={18} className="text-gray-400" />
              </div>
              <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate">{currentUser.email.split('@')[0]}</span>
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col pt-20 h-full">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
            
            {!hasApiKey && (
              <div className={`${theme.alertBg} border ${theme.alertBorder} ${theme.alertText} px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-3 max-w-4xl mx-auto`}>
                <AlertTriangle size={20} className="flex-shrink-0" />
                <p>
                  API Anahtarı bulunamadı. Uygulamanın çalışması için bir Google API anahtarı yapılandırılmalıdır. (Geliştirici Notu: process.env.API_KEY eksik.)
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="w-full max-w-4xl mx-auto">
                <MessageItem 
                  message={msg} 
                  accentColor={accentColor} 
                  onFeedback={handleMessageFeedback} 
                />
              </div>
            ))}
            
            {isLoading && (
              <div className="w-full max-w-4xl mx-auto flex items-start gap-3 animate-fade-in">
                 <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${theme.bubbleAi} border ${theme.bubbleAiBorder}`}>
                  <svg className="w-5 h-5 text-white animate-pulse" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 8V4H8"></path>
                    <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                    <path d="M2 14h2"></path>
                    <path d="M20 14h2"></path>
                    <path d="M15 13v2"></path>
                    <path d="M9 13v2"></path>
                  </svg>
                </div>
                <div className={`px-5 py-4 rounded-2xl ${theme.bubbleAi} rounded-bl-none shadow-lg min-w-[200px]`}>
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-medium text-gray-300 animate-pulse flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"></span>
                      Yanıt oluşturuluyor...
                    </span>
                    <div className="h-1 w-full bg-gray-800/50 rounded-full overflow-hidden relative">
                      <div className={`absolute top-0 left-0 h-full w-1/3 ${theme.primary} rounded-full animate-[slide-progress_1s_linear_infinite]`}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 md:p-6 w-full max-w-4xl mx-auto bg-gray-900/95">
            <div className={`bg-gray-950 p-2 rounded-3xl border border-gray-800 shadow-inner transition-all focus-within:border-gray-700 focus-within:ring-1 focus-within:ring-gray-700/50 ${isListening ? 'ring-1 ring-green-500/50 border-green-900' : ''}`}>
              <form 
                className="flex items-end space-x-2"
                onSubmit={(e) => handleSend(e)}
              >
                <input 
                  className="hidden" 
                  accept="image/*,video/*,audio/*" 
                  type="file" 
                  id="file-upload"
                />
                <button 
                  type="button" 
                  className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 disabled:cursor-not-allowed transition-colors" 
                  aria-label="Dosya ekle"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Paperclip size={20} />
                </button>
                
                <textarea 
                  ref={textareaRef}
                  placeholder={isListening ? "Dinliyor..." : "Mesajını buraya yaz kanka..."}
                  rows={1} 
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent p-2.5 text-white placeholder-gray-500 focus:outline-none resize-none max-h-40 min-h-[44px] leading-relaxed"
                  style={{ height: '48px' }}
                />
                
                <button 
                  type="submit" 
                  disabled={!input.trim() || isLoading || !hasApiKey}
                  className={`w-10 h-10 flex-shrink-0 ${theme.primary} rounded-full flex items-center justify-center text-white disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 ${theme.primaryHover} focus:outline-none focus:ring-2 ${theme.ring}`}
                >
                  <Send size={18} className={input.trim() ? "ml-0.5" : ""} />
                </button>
              </form>
            </div>
            <div className="text-center mt-2">
               <p className="text-xs text-gray-600">Td AI hata yapabilir. Önemli bilgileri kontrol edin.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
