import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Video, Paperclip, Menu, User, AlertTriangle, X, Camera, StopCircle, Settings, Image as ImageIcon, Trash2, MoreVertical, Code, Palette, BookOpen, Lightbulb, Sparkles, Bookmark, Star, Upload, Film, Files, Check } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { MessageItem } from './components/MessageItem';
import { SettingsModal } from './components/SettingsModal';
import { LoginScreen } from './components/LoginScreen';
import { sendMessageToGemini, generateImageWithGemini, generateChatTitle } from './services/geminiService';
import { Message, ChatSession } from './types';
import { THEMES } from './utils/theme';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const DEFAULT_PERSONA = `Sen Td AI'sın. Türk toplumu gibi konuşan, samimi, 'kanka', 'abi', 'hocam' gibi hitapları yeri gelince kullanan, esprili ve zeki bir yapay zekasın.`;

// Storage Keys
const STORAGE_KEYS = {
  SESSIONS: 'tdai_sessions',
  PERSONA: 'tdai_persona',
  THEME: 'tdai_theme',
  USER: 'tdai_user',
  LAST_SESSION_ID: 'tdai_last_session_id',
  SAVED_ITEMS: 'tdai_saved_items',
  // Settings
  FONT_FAMILY: 'tdai_font_family',
  FONT_SIZE: 'tdai_font_size',
  ENTER_TO_SEND: 'tdai_enter_to_send',
  TYPING_EFFECT: 'tdai_typing_effect',
  TEMPERATURE: 'tdai_temperature',
  SOUND_ENABLED: 'tdai_sound_enabled',
  CHAT_WIDTH: 'tdai_chat_width',
  SIDEBAR_POS: 'tdai_sidebar_pos',
  CONTEXT_LIMIT: 'tdai_context_limit',
  AUTO_SCROLL: 'tdai_auto_scroll',
  // New Settings
  MAX_TOKENS: 'tdai_max_tokens',
  TOP_P: 'tdai_top_p',
  USERNAME: 'tdai_username',
  SHOW_AVATARS: 'tdai_show_avatars',
  TIME_FORMAT: 'tdai_time_format',
  NOTIFICATIONS: 'tdai_notifications',
  SHOW_LATENCY: 'tdai_show_latency',
};

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'model',
  text: "Merhaba!.Hoşgeldin.Tda Company'nin Yapay Zekası,Td AI'e Hoşgeldin! Şimdiden Sorun Varsa,Çekinmeden Söyle. SİTELERİ: link.bilfen.com/TdaCompany",
  timestamp: Date.now(),
};

const SUPPORTED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  'video/mp4', 'video/mpeg', 'video/mov', 'video/quicktime', 'video/webm'
];

const MAX_FILE_SIZE_MB = 10;

const QUICK_PROMPT_OPTIONS = {
  code: [
    'Python ile gelişmiş bir Hesap Makinesi (GUI) kodu yaz.',
    'React ve Tailwind kullanarak responsive bir Navbar bileşeni oluştur.',
    'Node.js ile basit bir REST API (CRUD işlemleri) oluştur.',
    'Javascript ile rastgele şifre üreten güvenli bir fonksiyon yaz.',
    'HTML ve CSS kullanarak modern bir "Fiyatlandırma Tablosu" tasarla.'
  ],
  image: [
    'Neon ışıklarıyla aydınlanmış siberpunk bir İstanbul sokağı çiz.',
    'Mars yüzeyinde kurulmuş cam fanus içinde fütüristik bir şehir çiz.',
    'Van Gogh tarzında, yıldızlı bir gecede uçan bir roket çiz.',
    'Su altında yaşayan, biyolüminesans (ışık saçan) bitkilerle dolu bir orman çiz.'
  ],
  lesson: [
    'Kuantum Fiziğini 5 yaşındaki bir çocuğa anlatır gibi basitleştir.',
    'Fransız İhtilali\'nin nedenlerini ve sonuçlarını maddeler halinde özetle.',
    'İngilizce\'deki tüm zamanları (Tenses) bir tablo halinde örneklerle açıkla.'
  ],
  idea: [
    'YouTube kanalı için hiç yapılmamış, özgün 5 video fikri ver.',
    'Bugün akşam yemeği için hem sağlıklı hem de pratik 3 tarif öner.',
    'Teknoloji üzerine bir blog açsam hangi niş konuları seçmeliyim?'
  ],
  surprise: [
    'Eğer renklerin tadı olsaydı, "Mavi"nin tadı neye benzerdi? Betimle.',
    'Bir zaman makinesi icat ettin ama sadece 5 dakika geriye gidebiliyor.',
    'Dünyadaki tüm kediler bir anda konuşmaya başlasaydı, ilk şikayetleri ne olurdu?'
  ]
};

interface PendingAttachment {
  data: string; // Base64
  file: File | null;
  type: 'image' | 'video';
  name: string;
  size: string;
}

interface QuickActionItem {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
}

interface SavedItem {
  id: string;
  text: string;
  timestamp: number;
}

const App: React.FC = () => {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<{ email: string; isGuest: boolean } | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : null;
  });

  // --- UI State ---
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [activeQuickTab, setActiveQuickTab] = useState<'suggestions' | 'saved'>('suggestions');
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [currentQuickActions, setCurrentQuickActions] = useState<QuickActionItem[]>([]);
  const [isHistoryCopied, setIsHistoryCopied] = useState(false);
  const [lastLatency, setLastLatency] = useState<number | undefined>(undefined);
  
  // --- Settings State ---
  const [persona, setPersona] = useState(() => localStorage.getItem(STORAGE_KEYS.PERSONA) || DEFAULT_PERSONA);
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem(STORAGE_KEYS.THEME) || 'red');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xl'>(() => (localStorage.getItem(STORAGE_KEYS.FONT_SIZE) as 'normal' | 'large' | 'xl') || 'normal');
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem(STORAGE_KEYS.FONT_FAMILY) || 'font-sans');
  
  // Behavior
  const [enterToSend, setEnterToSend] = useState(() => localStorage.getItem(STORAGE_KEYS.ENTER_TO_SEND) !== 'false');
  const [typingEffect, setTypingEffect] = useState(() => localStorage.getItem(STORAGE_KEYS.TYPING_EFFECT) !== 'false');
  const [autoScroll, setAutoScroll] = useState(() => localStorage.getItem(STORAGE_KEYS.AUTO_SCROLL) !== 'false');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED) === 'true');
  
  // Layout
  const [chatWidth, setChatWidth] = useState<'normal' | 'full'>(() => (localStorage.getItem(STORAGE_KEYS.CHAT_WIDTH) as 'normal' | 'full') || 'normal');
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>(() => (localStorage.getItem(STORAGE_KEYS.SIDEBAR_POS) as 'left' | 'right') || 'left');

  // AI Config
  const [contextLimit, setContextLimit] = useState<'low' | 'medium' | 'high'>(() => (localStorage.getItem(STORAGE_KEYS.CONTEXT_LIMIT) as 'low' | 'medium' | 'high') || 'medium');
  const [temperature, setTemperature] = useState(() => parseFloat(localStorage.getItem(STORAGE_KEYS.TEMPERATURE) || '0.7'));
  
  // NEW SETTINGS STATES
  const [username, setUsername] = useState(() => localStorage.getItem(STORAGE_KEYS.USERNAME) || 'Sen');
  const [maxOutputTokens, setMaxOutputTokens] = useState(() => parseInt(localStorage.getItem(STORAGE_KEYS.MAX_TOKENS) || '4096'));
  const [topP, setTopP] = useState(() => parseFloat(localStorage.getItem(STORAGE_KEYS.TOP_P) || '0.95'));
  const [showAvatars, setShowAvatars] = useState(() => localStorage.getItem(STORAGE_KEYS.SHOW_AVATARS) !== 'false');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>(() => (localStorage.getItem(STORAGE_KEYS.TIME_FORMAT) as '12h' | '24h') || '24h');
  const [notifications, setNotifications] = useState(() => localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) === 'true');
  const [showLatency, setShowLatency] = useState(() => localStorage.getItem(STORAGE_KEYS.SHOW_LATENCY) === 'true');

  // --- Chat Data State ---
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.LAST_SESSION_ID) || null;
  });

  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_ITEMS);
    return saved ? JSON.parse(saved) : [];
  });

  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);

  // --- Effects for Persistence ---
  // Helper to persist settings
  const persist = (key: string, val: any) => localStorage.setItem(key, String(val));

  useEffect(() => {
    if (currentSessionId) {
      const session = sessions.find(s => s.id === currentSessionId);
      setMessages(session ? session.messages : [WELCOME_MESSAGE]);
      if (!session) setCurrentSessionId(null);
    } else {
       setMessages([WELCOME_MESSAGE]);
    }
    localStorage.setItem(STORAGE_KEYS.LAST_SESSION_ID, currentSessionId || '');
  }, [currentSessionId, sessions]);

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SAVED_ITEMS, JSON.stringify(savedItems)); }, [savedItems]);
  
  // Settings Effects
  useEffect(() => persist(STORAGE_KEYS.PERSONA, persona), [persona]);
  useEffect(() => persist(STORAGE_KEYS.THEME, accentColor), [accentColor]);
  useEffect(() => persist(STORAGE_KEYS.FONT_SIZE, fontSize), [fontSize]);
  useEffect(() => persist(STORAGE_KEYS.FONT_FAMILY, fontFamily), [fontFamily]);
  useEffect(() => persist(STORAGE_KEYS.ENTER_TO_SEND, enterToSend), [enterToSend]);
  useEffect(() => persist(STORAGE_KEYS.TYPING_EFFECT, typingEffect), [typingEffect]);
  useEffect(() => persist(STORAGE_KEYS.TEMPERATURE, temperature), [temperature]);
  useEffect(() => persist(STORAGE_KEYS.SOUND_ENABLED, soundEnabled), [soundEnabled]);
  useEffect(() => persist(STORAGE_KEYS.CHAT_WIDTH, chatWidth), [chatWidth]);
  useEffect(() => persist(STORAGE_KEYS.SIDEBAR_POS, sidebarPosition), [sidebarPosition]);
  useEffect(() => persist(STORAGE_KEYS.CONTEXT_LIMIT, contextLimit), [contextLimit]);
  useEffect(() => persist(STORAGE_KEYS.AUTO_SCROLL, autoScroll), [autoScroll]);
  useEffect(() => persist(STORAGE_KEYS.USERNAME, username), [username]);
  useEffect(() => persist(STORAGE_KEYS.MAX_TOKENS, maxOutputTokens), [maxOutputTokens]);
  useEffect(() => persist(STORAGE_KEYS.TOP_P, topP), [topP]);
  useEffect(() => persist(STORAGE_KEYS.SHOW_AVATARS, showAvatars), [showAvatars]);
  useEffect(() => persist(STORAGE_KEYS.TIME_FORMAT, timeFormat), [timeFormat]);
  useEffect(() => persist(STORAGE_KEYS.NOTIFICATIONS, notifications), [notifications]);
  useEffect(() => persist(STORAGE_KEYS.SHOW_LATENCY, showLatency), [showLatency]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickMenuRef = useRef<HTMLDivElement>(null);

  const hasApiKey = !!process.env.API_KEY;
  const theme = THEMES[accentColor] || THEMES.red;

  // Auto Scroll
  useEffect(() => {
    if (autoScroll) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingAttachment, autoScroll]);

  // --- Notifications Logic ---
  const sendDesktopNotification = (text: string) => {
    if (notifications && document.hidden && Notification.permission === "granted") {
      new Notification("Td AI", { body: text.substring(0, 100), icon: '/vite.svg' });
    }
  };
  
  useEffect(() => {
    if (notifications && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, [notifications]);

  // --- Export Chat ---
  const handleExportChat = () => {
    const data = {
      sessionTitle: sessions.find(s => s.id === currentSessionId)?.title || "Export",
      exportedAt: new Date().toISOString(),
      messages: messages
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tdai_chat_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Handlers (Login, File, Video, QuickActions - same as before) ---
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

  const handleResetData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

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
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('');
      if (event.results[0].isFinal) {
         setInput((prev) => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + transcript);
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const processFile = (file: File) => {
    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
      alert(`Hata: Desteklenmeyen dosya türü.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`Hata: Dosya boyutu çok büyük (Max ${MAX_FILE_SIZE_MB}MB).`);
      return;
    }
    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = (e) => {
      setPendingAttachment({
        data: e.target?.result as string,
        file: file,
        type: isVideo ? 'video' : 'image',
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
      });
    };
    reader.readAsDataURL(file);
  };

  const startVideo = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Tarayıcınız kamera özelliğini desteklemiyor.");
      return;
    }

    try {
      // Kullanıcıdan kamera izni iste
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      setIsVideoOpen(true);
    } catch (err: any) {
      console.error("Kamera erişim hatası:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert("Kamerayı kullanmak için lütfen tarayıcıdan izin verin.");
      } else if (err.name === 'NotFoundError') {
        alert("Kamera cihazı bulunamadı.");
      } else {
        alert("Kameraya erişilemedi. Lütfen izinleri kontrol edin.");
      }
    }
  };

  const captureToAttachment = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const imageBase64 = canvasRef.current.toDataURL('image/jpeg', 0.8);
      setPendingAttachment({
        data: imageBase64,
        file: null,
        type: 'image',
        name: `Kamera_${Date.now()}.jpg`,
        size: 'Live' 
      });
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      setIsVideoOpen(false);
    }
  };

  const getRandomPrompt = (cat: keyof typeof QUICK_PROMPT_OPTIONS, excludePrompt?: string) => {
    const opts = QUICK_PROMPT_OPTIONS[cat];
    let selected = opts[Math.floor(Math.random() * opts.length)];
    
    // Eğer aynı prompt geldiyse ve listede birden fazla seçenek varsa, tekrar dene
    if (excludePrompt && opts.length > 1) {
      while (selected === excludePrompt) {
        selected = opts[Math.floor(Math.random() * opts.length)];
      }
    }
    return selected;
  };

  const toggleQuickMenu = () => {
    if (!isQuickActionsOpen) {
      // Her açılışta taze, bir öncekiyle çakışmayan promptlar seç
      setCurrentQuickActions(prevActions => [
        { 
          id: 'code', 
          label: 'Kod Örnekleri', 
          icon: Code, 
          prompt: getRandomPrompt('code', prevActions.find(a => a.id === 'code')?.prompt) 
        },
        { 
          id: 'image', 
          label: 'Görsel Tasarım', 
          icon: Palette, 
          prompt: getRandomPrompt('image', prevActions.find(a => a.id === 'image')?.prompt) 
        },
        { 
          id: 'lesson', 
          label: 'Ders Notları', 
          icon: BookOpen, 
          prompt: getRandomPrompt('lesson', prevActions.find(a => a.id === 'lesson')?.prompt) 
        },
        { 
          id: 'idea', 
          label: 'Fikir Üretimi', 
          icon: Lightbulb, 
          prompt: getRandomPrompt('idea', prevActions.find(a => a.id === 'idea')?.prompt) 
        },
        { 
          id: 'surprise', 
          label: 'Şaşırt Beni', 
          icon: Sparkles, 
          prompt: getRandomPrompt('surprise', prevActions.find(a => a.id === 'surprise')?.prompt) 
        },
      ]);
    }
    setIsQuickActionsOpen(!isQuickActionsOpen);
  };

  const handleSaveMessage = (text: string) => {
    setSavedItems(prev => {
      if (prev.some(item => item.text === text)) return prev;
      return [{ id: Date.now().toString(), text, timestamp: Date.now() }, ...prev];
    });
  };

  const createNewSession = (initialMessages: Message[], title: string) => {
    const newId = Date.now().toString();
    const newSession: ChatSession = { id: newId, title, date: new Date().toISOString(), timestamp: Date.now(), messages: initialMessages };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    return newId;
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const hasText = input.trim().length > 0;
    const attachedData = pendingAttachment?.data;
    if ((!hasText && !attachedData) || isLoading || !hasApiKey) return;

    const userText = input.trim();
    const finalText = userText || (attachedData ? (pendingAttachment.type === 'video' ? "Videoyu analiz et." : "Resmi analiz et.") : "");
    
    setInput('');
    setPendingAttachment(null);
    if (textareaRef.current) textareaRef.current.style.height = '48px';

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: finalText,
      image: attachedData,
      mediaType: pendingAttachment?.type,
      timestamp: Date.now(),
    };

    let activeMessages = currentSessionId ? [...messages, newUserMessage] : [newUserMessage]; 
    let activeSessionId = currentSessionId;

    // Handle new session creation and title generation
    if (!activeSessionId) {
      setMessages(activeMessages);
      setIsLoading(true);
      activeSessionId = createNewSession(activeMessages, "Yeni Sohbet...");
      
      // Asynchronously generate a title based on the first message
      generateChatTitle(finalText)
        .then(title => {
          setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, title } : s));
        })
        .catch(err => console.error("Title generation failed", err));
        
    } else {
      setMessages(activeMessages);
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: activeMessages } : s));
      setIsLoading(true);
    }

    const startTime = Date.now();

    try {
      let responseText = "";
      let generatedImage = undefined;
      const lowerText = finalText.toLowerCase();
      
      if (!attachedData && (lowerText.startsWith('resim çiz') || lowerText.includes('görsel oluştur'))) {
        generatedImage = await generateImageWithGemini(finalText);
        responseText = `İşte görselin: ${finalText}`;
      } else {
        let sliceCount = contextLimit === 'low' ? 5 : contextLimit === 'high' ? 30 : 15;
        const historyForGemini = activeMessages.slice(0, -1)
          .filter(msg => msg.id !== 'welcome')
          .slice(-sliceCount)
          .map(msg => ({ role: msg.role, parts: [{ text: msg.text }] }));
        
        responseText = await sendMessageToGemini(
          finalText, 
          historyForGemini, 
          attachedData, 
          persona,
          { temperature, maxOutputTokens, topP }
        );
      }

      const latency = Date.now() - startTime;
      setLastLatency(latency);

      const newModelMessage: Message = {
        id: Date.now().toString(),
        role: 'model',
        text: responseText,
        image: generatedImage,
        mediaType: generatedImage ? 'image' : undefined,
        timestamp: Date.now(),
      };

      const finalMessages = [...activeMessages, newModelMessage];
      setMessages(finalMessages);
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: finalMessages } : s));
      
      if (soundEnabled) console.log("Beep");
      sendDesktopNotification(responseText);

    } catch (error: any) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'model',
        text: error.message || "Hata oluştu.",
        timestamp: Date.now(),
      };
      setMessages([...activeMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) return <LoginScreen onLogin={handleLogin} onGuestAccess={handleGuestAccess} accentColor={accentColor} />;

  return (
    <div className={`flex h-screen bg-black overflow-hidden selection:${theme.text} selection:bg-gray-800 ${sidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row'} ${fontFamily}`}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onNewChat={() => { setCurrentSessionId(null); setMessages([WELCOME_MESSAGE]); }}
        onDeleteHistory={() => { if(confirm("Silinsin mi?")) { setSessions([]); localStorage.removeItem(STORAGE_KEYS.SESSIONS); } }}
        accentColor={accentColor}
        currentUser={currentUser}
        onLogout={handleLogout}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={id => setCurrentSessionId(id)}
      />

      <div className="flex-1 flex flex-col h-full relative w-full">
        <header className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md z-10 absolute top-0 left-0 right-0 transition-all duration-300">
          <div className={`flex items-center gap-3 ${sidebarPosition === 'right' ? 'flex-row-reverse' : ''}`}>
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 transition-transform active:scale-90"><Menu size={24} /></button>
            <h1 className="text-lg font-semibold text-white flex items-center gap-2 select-none">
              Td AI <span className={`text-xs px-1.5 rounded-full ${theme.iconBg} ${theme.text} border ${theme.border} border-opacity-30`}>v2.5</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {!hasApiKey && <div className="text-yellow-500 text-xs flex items-center gap-1 animate-pulse"><AlertTriangle size={12} /> API Yok</div>}
            <button 
               onClick={() => {
                  navigator.clipboard.writeText(messages.map(m => `${m.role}: ${m.text}`).join('\n\n'));
                  setIsHistoryCopied(true);
                  setTimeout(() => setIsHistoryCopied(false), 2000);
               }}
               className={`p-2 text-gray-400 hover:${theme.text} hover:bg-gray-900/50 rounded-full transition-all duration-200 active:scale-90`}
            >
               {isHistoryCopied ? <Check size={20} className="text-green-500" /> : <Files size={20} />}
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className={`p-2 text-gray-400 hover:${theme.text} hover:bg-gray-900/50 rounded-full transition-all duration-200 active:scale-90`}><Settings size={20} /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pt-20 pb-4 px-2 md:px-4 scroll-smooth">
          <div className={`${chatWidth === 'full' ? 'max-w-full px-4' : 'max-w-3xl'} mx-auto space-y-6 min-h-[calc(100vh-180px)] transition-all duration-500 ease-smooth`}>
            {messages.map((msg, idx) => (
              <MessageItem 
                key={msg.id} 
                message={msg} 
                accentColor={accentColor} 
                onSave={handleSaveMessage}
                fontSize={fontSize}
                typingEffect={typingEffect}
                showAvatars={showAvatars}
                timeFormat={timeFormat}
                customUsername={username}
                latency={msg.role === 'model' && idx === messages.length - 1 && showLatency ? lastLatency : undefined}
              />
            ))}
            {isLoading && (
               <div className="flex items-center gap-3 pl-4 py-2 animate-fade-in">
                  <div className={`w-2 h-2 ${theme.primary} rounded-full animate-pulse-slow`}></div>
                  <div className={`w-2 h-2 ${theme.primary} rounded-full animate-pulse-slow delay-100`}></div>
                  <div className={`w-2 h-2 ${theme.primary} rounded-full animate-pulse-slow delay-200`}></div>
               </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </main>

        <div className="p-4 bg-black/80 backdrop-blur-md border-t border-gray-800/50 transition-all duration-300">
          <div className={`${chatWidth === 'full' ? 'max-w-5xl' : 'max-w-3xl'} mx-auto relative`}>
            
            {isQuickActionsOpen && (
              <div ref={quickMenuRef} className="absolute bottom-full left-0 mb-3 w-72 bg-gray-900/95 backdrop-blur border border-gray-800 rounded-xl shadow-2xl overflow-hidden origin-bottom-left animate-scale-in z-20 flex flex-col max-h-80">
                <div className="flex border-b border-gray-800">
                  <button onClick={() => setActiveQuickTab('suggestions')} className={`flex-1 py-2 text-xs font-bold transition-colors ${activeQuickTab === 'suggestions' ? theme.text : 'text-gray-500 hover:text-gray-300'}`}>ÖNERİLER</button>
                  <button onClick={() => setActiveQuickTab('saved')} className={`flex-1 py-2 text-xs font-bold transition-colors ${activeQuickTab === 'saved' ? theme.text : 'text-gray-500 hover:text-gray-300'}`}>KAYDEDİLENLER</button>
                </div>
                <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
                   {activeQuickTab === 'suggestions' 
                      ? currentQuickActions.map(a => <button key={a.id} onClick={() => { setInput(a.prompt); setIsQuickActionsOpen(false); }} className="flex gap-2 p-2.5 w-full hover:bg-gray-800 rounded-lg text-left text-sm text-gray-300 transition-colors items-center"><a.icon size={14} className={theme.text} />{a.label}</button>)
                      : savedItems.map(s => <button key={s.id} onClick={() => { setInput(s.text); setIsQuickActionsOpen(false); }} className="p-2.5 w-full hover:bg-gray-800 rounded-lg text-left text-sm text-gray-300 truncate border-b border-gray-800/50 last:border-0 transition-colors">{s.text}</button>)
                   }
                </div>
              </div>
            )}

            {pendingAttachment && (
               <div className="absolute bottom-full left-0 mb-2 bg-gray-900/90 backdrop-blur border border-gray-700 p-2 rounded-lg flex items-center gap-2 animate-slide-up-fade">
                  <span className="text-xs text-white truncate max-w-[200px]">{pendingAttachment.name}</span>
                  <button onClick={() => setPendingAttachment(null)} className="hover:text-red-500 transition-colors"><X size={14} className="text-gray-400" /></button>
               </div>
            )}

            <form onSubmit={handleSend} className={`relative flex items-end gap-2 bg-gray-900/50 border border-gray-700 p-2 rounded-2xl shadow-inner transition-all duration-200 focus-within:ring-1 focus-within:bg-gray-900 ${theme.ring}`}>
              <div className="flex items-center pb-1 gap-1">
                <button type="button" onClick={toggleQuickMenu} className={`p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-transform active:scale-90 ${isQuickActionsOpen ? theme.text : ''}`}><MoreVertical size={20} /></button>
                <div className="w-px h-5 bg-gray-700 mx-1"></div>
                <input type="file" ref={fileInputRef} onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-2 hover:text-white hover:bg-gray-800 rounded-full transition-transform active:scale-90 ${pendingAttachment ? theme.text : 'text-gray-400'}`}><Paperclip size={20} /></button>
                <button type="button" onClick={startVideo} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-transform active:scale-90"><Camera size={20} /></button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-transform active:scale-90"><Upload size={20} /></button>
              </div>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={e => { if(e.key === 'Enter' && enterToSend && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                placeholder={pendingAttachment ? "Medya hakkında..." : `Mesaj yaz ${username}...`}
                className={`flex-1 bg-transparent text-white placeholder-gray-500 p-2.5 min-h-[48px] max-h-[160px] resize-none focus:outline-none transition-all ${fontSize === 'large' ? 'text-lg' : fontSize === 'xl' ? 'text-xl' : 'text-sm'}`}
                rows={1}
              />
              <div className="flex items-center pb-1 gap-1">
                 <button type="button" onClick={toggleListening} className={`p-2 rounded-full transition-all active:scale-90 ${isListening ? 'bg-red-600 text-white animate-pulse' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>{isListening ? <StopCircle size={20} /> : <Mic size={20} />}</button>
                 <button type="submit" disabled={(!input.trim() && !pendingAttachment) || isLoading} className={`p-2 rounded-full transition-all transform active:scale-90 ${ (input.trim() || pendingAttachment) && !isLoading ? `${theme.primary} text-white shadow-lg` : 'bg-gray-800 text-gray-500' }`}><Send size={20} /></button>
              </div>
            </form>
            
            <div className="mt-2 text-center"><p className="text-[10px] text-gray-600 transition-opacity hover:opacity-80">Td AI hata yapabilir. Önemli bilgileri kontrol et.</p></div>
          </div>
        </div>
      </div>

      {isVideoOpen && (
         <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
            <button onClick={() => { setIsVideoOpen(false); streamRef.current?.getTracks().forEach(t => t.stop()); }} className="absolute top-4 right-4 text-white bg-gray-800/80 backdrop-blur p-2 rounded-full z-20 transition-transform active:scale-90"><X size={24}/></button>
            <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-10 left-0 right-0 flex justify-center"><button onClick={captureToAttachment} className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 shadow-2xl transition-transform active:scale-90"></button></div>
         </div>
      )}

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        currentPersona={persona} onSavePersona={setPersona}
        currentColor={accentColor} onSaveColor={setAccentColor}
        fontSize={fontSize} onSaveFontSize={setFontSize}
        fontFamily={fontFamily} onSaveFontFamily={setFontFamily}
        showAvatars={showAvatars} onSaveShowAvatars={setShowAvatars}
        timeFormat={timeFormat} onSaveTimeFormat={setTimeFormat}
        chatWidth={chatWidth} onSaveChatWidth={setChatWidth}
        sidebarPosition={sidebarPosition} onSaveSidebarPosition={setSidebarPosition}
        enterToSend={enterToSend} onSaveEnterToSend={setEnterToSend}
        typingEffect={typingEffect} onSaveTypingEffect={setTypingEffect}
        autoScroll={autoScroll} onSaveAutoScroll={setAutoScroll}
        notifications={notifications} onSaveNotifications={setNotifications}
        temperature={temperature} onSaveTemperature={setTemperature}
        contextLimit={contextLimit} onSaveContextLimit={setContextLimit}
        maxOutputTokens={maxOutputTokens} onSaveMaxOutputTokens={setMaxOutputTokens}
        topP={topP} onSaveTopP={setTopP}
        username={username} onSaveUsername={setUsername}
        soundEnabled={soundEnabled} onSaveSoundEnabled={setSoundEnabled}
        showLatency={showLatency} onSaveShowLatency={setShowLatency}
        onResetData={handleResetData}
        onExportChat={handleExportChat}
      />
    </div>
  );
};

export default App;