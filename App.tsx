import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Video, Paperclip, Menu, AlertTriangle, X, Camera, StopCircle, Settings, Trash2, MoreVertical, Code, Palette, BookOpen, Lightbulb, Sparkles, Bookmark, Upload, Files, Check, Lock, EyeOff } from 'lucide-react';
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
  USER: 'tdai_user', // Global key to track "who" is logged in
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
  MAX_TOKENS: 'tdai_max_tokens',
  TOP_P: 'tdai_top_p',
  USERNAME: 'tdai_username',
  USER_AVATAR: 'tdai_user_avatar', // New key for profile picture
  SHOW_AVATARS: 'tdai_show_avatars',
  TIME_FORMAT: 'tdai_time_format',
  NOTIFICATIONS: 'tdai_notifications',
  SHOW_LATENCY: 'tdai_show_latency',
  // Advanced Settings
  BORDER_RADIUS: 'tdai_border_radius',
  ANIMATION_SPEED: 'tdai_animation_speed',
  SHOW_LINE_NUMBERS: 'tdai_show_line_numbers',
  FREQUENCY_PENALTY: 'tdai_freq_penalty',
  PRESENCE_PENALTY: 'tdai_pres_penalty',
  SAFETY_LEVEL: 'tdai_safety_level',
  INCOGNITO_MODE: 'tdai_incognito_mode',
  HAPTIC_FEEDBACK: 'tdai_haptic_feedback',
  // Even More Settings
  UI_DENSITY: 'tdai_ui_density',
  MESSAGE_ALIGNMENT: 'tdai_msg_alignment',
  BACKGROUND_STYLE: 'tdai_bg_style',
  GLASS_EFFECT: 'tdai_glass_effect',
  BLUR_ON_LEAVE: 'tdai_blur_leave',
  VOICE_SPEED: 'tdai_voice_speed',
  AUTO_READ: 'tdai_auto_read',
  SHOW_TOKEN_COUNT: 'tdai_token_count',
  DEBUG_MODE: 'tdai_debug_mode',
  START_PAGE: 'tdai_start_page',
  SPELLCHECK: 'tdai_spellcheck'
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

// Helper to get user-specific keys
const getScopedKey = (key: string, email?: string) => {
  if (!email) return key;
  return `${key}_${email}`;
};

const App: React.FC = () => {
  // --- Auth State Initialization (Read-only for init) ---
  const initialUserString = localStorage.getItem(STORAGE_KEYS.USER);
  const initialUser = initialUserString ? JSON.parse(initialUserString) : null;
  const userEmail = initialUser?.email;

  // Helper for reading initial state with user scope
  const getInitialState = (key: string, defaultValue: any) => {
    const scopedKey = getScopedKey(key, userEmail);
    const saved = localStorage.getItem(scopedKey);
    if (saved === null) return defaultValue;
    if (typeof defaultValue === 'boolean') return saved === 'true';
    if (typeof defaultValue === 'number') return parseFloat(saved);
    try {
      return JSON.parse(saved);
    } catch {
      return saved;
    }
  };

  const [currentUser, setCurrentUser] = useState<{ email: string; isGuest: boolean } | null>(initialUser);

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
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  
  // --- Settings State (Persistent & Scoped) ---
  const [persona, setPersona] = useState(() => getInitialState(STORAGE_KEYS.PERSONA, DEFAULT_PERSONA));
  const [accentColor, setAccentColor] = useState(() => getInitialState(STORAGE_KEYS.THEME, 'red'));
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xl'>(() => getInitialState(STORAGE_KEYS.FONT_SIZE, 'normal'));
  const [fontFamily, setFontFamily] = useState(() => getInitialState(STORAGE_KEYS.FONT_FAMILY, 'font-sans'));
  
  // Behavior
  const [enterToSend, setEnterToSend] = useState(() => getInitialState(STORAGE_KEYS.ENTER_TO_SEND, true));
  const [typingEffect, setTypingEffect] = useState(() => getInitialState(STORAGE_KEYS.TYPING_EFFECT, true));
  const [autoScroll, setAutoScroll] = useState(() => getInitialState(STORAGE_KEYS.AUTO_SCROLL, true));
  const [soundEnabled, setSoundEnabled] = useState(() => getInitialState(STORAGE_KEYS.SOUND_ENABLED, false));
  
  // Layout
  const [chatWidth, setChatWidth] = useState<'normal' | 'full'>(() => getInitialState(STORAGE_KEYS.CHAT_WIDTH, 'normal'));
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>(() => getInitialState(STORAGE_KEYS.SIDEBAR_POS, 'left'));

  // AI Config (Basic)
  const [contextLimit, setContextLimit] = useState<'low' | 'medium' | 'high'>(() => getInitialState(STORAGE_KEYS.CONTEXT_LIMIT, 'medium'));
  const [temperature, setTemperature] = useState(() => getInitialState(STORAGE_KEYS.TEMPERATURE, 0.7));
  
  // AI Config (Advanced)
  const [username, setUsername] = useState(() => getInitialState(STORAGE_KEYS.USERNAME, 'Sen'));
  const [userAvatar, setUserAvatar] = useState<string | null>(() => getInitialState(STORAGE_KEYS.USER_AVATAR, null));
  const [maxOutputTokens, setMaxOutputTokens] = useState(() => getInitialState(STORAGE_KEYS.MAX_TOKENS, 4096));
  const [topP, setTopP] = useState(() => getInitialState(STORAGE_KEYS.TOP_P, 0.95));
  const [frequencyPenalty, setFrequencyPenalty] = useState(() => getInitialState(STORAGE_KEYS.FREQUENCY_PENALTY, 0));
  const [presencePenalty, setPresencePenalty] = useState(() => getInitialState(STORAGE_KEYS.PRESENCE_PENALTY, 0));
  const [safetyLevel, setSafetyLevel] = useState<'low' | 'medium' | 'high' | 'none'>(() => getInitialState(STORAGE_KEYS.SAFETY_LEVEL, 'none'));

  // Visuals (Advanced)
  const [showAvatars, setShowAvatars] = useState(() => getInitialState(STORAGE_KEYS.SHOW_AVATARS, true));
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>(() => getInitialState(STORAGE_KEYS.TIME_FORMAT, '24h'));
  const [borderRadius, setBorderRadius] = useState<'small' | 'medium' | 'large' | 'full'>(() => getInitialState(STORAGE_KEYS.BORDER_RADIUS, 'large'));
  const [animationSpeed, setAnimationSpeed] = useState<'slow' | 'normal' | 'fast'>(() => getInitialState(STORAGE_KEYS.ANIMATION_SPEED, 'normal'));
  const [showLineNumbers, setShowLineNumbers] = useState(() => getInitialState(STORAGE_KEYS.SHOW_LINE_NUMBERS, true));

  // System
  const [notifications, setNotifications] = useState(() => getInitialState(STORAGE_KEYS.NOTIFICATIONS, false));
  const [showLatency, setShowLatency] = useState(() => getInitialState(STORAGE_KEYS.SHOW_LATENCY, false));
  const [incognitoMode, setIncognitoMode] = useState(() => getInitialState(STORAGE_KEYS.INCOGNITO_MODE, false));
  const [hapticFeedback, setHapticFeedback] = useState(() => getInitialState(STORAGE_KEYS.HAPTIC_FEEDBACK, false));

  // --- SUPER ADVANCED NEW SETTINGS ---
  const [uiDensity, setUiDensity] = useState<'compact' | 'comfortable'>(() => getInitialState(STORAGE_KEYS.UI_DENSITY, 'comfortable'));
  const [messageAlignment, setMessageAlignment] = useState<'modern' | 'classic'>(() => getInitialState(STORAGE_KEYS.MESSAGE_ALIGNMENT, 'modern'));
  const [backgroundStyle, setBackgroundStyle] = useState<'solid' | 'gradient' | 'particles'>(() => getInitialState(STORAGE_KEYS.BACKGROUND_STYLE, 'gradient'));
  const [glassEffect, setGlassEffect] = useState(() => getInitialState(STORAGE_KEYS.GLASS_EFFECT, true));
  const [blurOnLeave, setBlurOnLeave] = useState(() => getInitialState(STORAGE_KEYS.BLUR_ON_LEAVE, false));
  const [voiceSpeed, setVoiceSpeed] = useState(() => getInitialState(STORAGE_KEYS.VOICE_SPEED, 1));
  const [autoRead, setAutoRead] = useState(() => getInitialState(STORAGE_KEYS.AUTO_READ, false));
  const [showTokenCount, setShowTokenCount] = useState(() => getInitialState(STORAGE_KEYS.SHOW_TOKEN_COUNT, false));
  const [debugMode, setDebugMode] = useState(() => getInitialState(STORAGE_KEYS.DEBUG_MODE, false));
  const [startPage, setStartPage] = useState<'chat' | 'new' | 'history'>(() => getInitialState(STORAGE_KEYS.START_PAGE, 'chat'));
  const [spellcheck, setSpellcheck] = useState(() => getInitialState(STORAGE_KEYS.SPELLCHECK, true));

  // --- Chat Data State ---
  const [sessions, setSessions] = useState<ChatSession[]>(() => getInitialState(STORAGE_KEYS.SESSIONS, []));
  
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    const scopedKey = getScopedKey(STORAGE_KEYS.LAST_SESSION_ID, userEmail);
    return localStorage.getItem(scopedKey) || null;
  });

  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => getInitialState(STORAGE_KEYS.SAVED_ITEMS, []));

  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);

  // --- Effects for Persistence (Scoped) ---
  // Helper to persist settings scoped to user
  const persist = (key: string, val: any) => {
    if (!currentUser) return;
    const scopedKey = getScopedKey(key, currentUser.email);
    if (typeof val === 'object') {
      localStorage.setItem(scopedKey, JSON.stringify(val));
    } else {
      localStorage.setItem(scopedKey, String(val));
    }
  };

  useEffect(() => {
    // Window Blur/Focus for Privacy Shield
    const handleBlur = () => blurOnLeave && setIsWindowBlurred(true);
    const handleFocus = () => setIsWindowBlurred(false);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
       window.removeEventListener('blur', handleBlur);
       window.removeEventListener('focus', handleFocus);
    };
  }, [blurOnLeave]);

  useEffect(() => {
    if (incognitoMode) {
      return; 
    }
    if (currentSessionId) {
      const session = sessions.find(s => s.id === currentSessionId);
      setMessages(session ? session.messages : [WELCOME_MESSAGE]);
      if (!session) setCurrentSessionId(null);
    } else {
       setMessages([WELCOME_MESSAGE]);
    }
    if(currentUser) {
      localStorage.setItem(getScopedKey(STORAGE_KEYS.LAST_SESSION_ID, currentUser.email), currentSessionId || '');
    }
  }, [currentSessionId, sessions, incognitoMode, currentUser]);

  useEffect(() => { 
    if (!incognitoMode) {
      persist(STORAGE_KEYS.SESSIONS, sessions); 
    }
  }, [sessions, incognitoMode, currentUser]);

  useEffect(() => { persist(STORAGE_KEYS.SAVED_ITEMS, savedItems); }, [savedItems, currentUser]);
  
  // Settings Effects
  useEffect(() => persist(STORAGE_KEYS.PERSONA, persona), [persona, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.THEME, accentColor), [accentColor, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.FONT_SIZE, fontSize), [fontSize, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.FONT_FAMILY, fontFamily), [fontFamily, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.ENTER_TO_SEND, enterToSend), [enterToSend, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.TYPING_EFFECT, typingEffect), [typingEffect, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.TEMPERATURE, temperature), [temperature, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.SOUND_ENABLED, soundEnabled), [soundEnabled, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.CHAT_WIDTH, chatWidth), [chatWidth, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.SIDEBAR_POS, sidebarPosition), [sidebarPosition, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.CONTEXT_LIMIT, contextLimit), [contextLimit, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.AUTO_SCROLL, autoScroll), [autoScroll, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.USERNAME, username), [username, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.USER_AVATAR, userAvatar), [userAvatar, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.MAX_TOKENS, maxOutputTokens), [maxOutputTokens, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.TOP_P, topP), [topP, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.SHOW_AVATARS, showAvatars), [showAvatars, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.TIME_FORMAT, timeFormat), [timeFormat, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.NOTIFICATIONS, notifications), [notifications, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.SHOW_LATENCY, showLatency), [showLatency, currentUser]);
  
  // Advanced Settings Effects
  useEffect(() => persist(STORAGE_KEYS.BORDER_RADIUS, borderRadius), [borderRadius, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.ANIMATION_SPEED, animationSpeed), [animationSpeed, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.SHOW_LINE_NUMBERS, showLineNumbers), [showLineNumbers, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.FREQUENCY_PENALTY, frequencyPenalty), [frequencyPenalty, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.PRESENCE_PENALTY, presencePenalty), [presencePenalty, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.SAFETY_LEVEL, safetyLevel), [safetyLevel, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.INCOGNITO_MODE, incognitoMode), [incognitoMode, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.HAPTIC_FEEDBACK, hapticFeedback), [hapticFeedback, currentUser]);
  
  // Mega Advanced Settings Effects
  useEffect(() => persist(STORAGE_KEYS.UI_DENSITY, uiDensity), [uiDensity, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.MESSAGE_ALIGNMENT, messageAlignment), [messageAlignment, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.BACKGROUND_STYLE, backgroundStyle), [backgroundStyle, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.GLASS_EFFECT, glassEffect), [glassEffect, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.BLUR_ON_LEAVE, blurOnLeave), [blurOnLeave, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.VOICE_SPEED, voiceSpeed), [voiceSpeed, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.AUTO_READ, autoRead), [autoRead, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.SHOW_TOKEN_COUNT, showTokenCount), [showTokenCount, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.DEBUG_MODE, debugMode), [debugMode, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.START_PAGE, startPage), [startPage, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.SPELLCHECK, spellcheck), [spellcheck, currentUser]);


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

  // Haptic Trigger
  const triggerHaptic = () => {
     if (hapticFeedback && navigator.vibrate) {
        navigator.vibrate(50);
     }
  };

  // --- Export Chat ---
  const handleExportChat = () => {
    const data = {
      sessionTitle: sessions.find(s => s.id === currentSessionId)?.title || "Export",
      exportedAt: new Date().toISOString(),
      messages: messages,
      settings: {
          persona, accentColor, fontSize, fontFamily
      }
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

  // --- Handlers (Login, File, Video, QuickActions) ---
  const handleLogin = (email: string) => {
    const user = { email, isGuest: false };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    // Force reload to initialize state with new user's data scope
    window.location.reload();
  };

  const handleGuestAccess = () => {
    const user = { email: 'Misafir Kullanıcı', isGuest: true };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    window.location.reload();
  };

  const handleLogout = () => {
    if (window.confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.reload();
    }
  };

  const handleResetData = () => {
    if (!currentUser) return;
    // Only remove keys for this user
    const suffix = `_${currentUser.email}`;
    Object.keys(localStorage).forEach(key => {
      if (key.endsWith(suffix)) {
        localStorage.removeItem(key);
      }
    });
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
    triggerHaptic();
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
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      // Get the last result which is the most relevant for the current phrase
      const lastResultIndex = event.results.length - 1;
      const transcript = event.results[lastResultIndex][0].transcript;
      
      // If it's final, append it. If interim, we might want to show it differently but for simplicity we append only finals or current interim
      if (event.results[lastResultIndex].isFinal) {
         setInput((prev) => {
             const needsSpace = prev.length > 0 && !prev.endsWith(' ');
             return prev + (needsSpace ? ' ' : '') + transcript;
         });
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
    triggerHaptic();
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
    triggerHaptic();
    if (!isQuickActionsOpen) {
      // Her açılışta taze, bir öncekiyle çakışmayan promptlar seç
      setCurrentQuickActions(prevActions => [
        { id: 'code', label: 'Kod Örnekleri', icon: Code, prompt: getRandomPrompt('code', prevActions.find(a => a.id === 'code')?.prompt) },
        { id: 'image', label: 'Görsel Tasarım', icon: Palette, prompt: getRandomPrompt('image', prevActions.find(a => a.id === 'image')?.prompt) },
        { id: 'lesson', label: 'Ders Notları', icon: BookOpen, prompt: getRandomPrompt('lesson', prevActions.find(a => a.id === 'lesson')?.prompt) },
        { id: 'idea', label: 'Fikir Üretimi', icon: Lightbulb, prompt: getRandomPrompt('idea', prevActions.find(a => a.id === 'idea')?.prompt) },
        { id: 'surprise', label: 'Şaşırt Beni', icon: Sparkles, prompt: getRandomPrompt('surprise', prevActions.find(a => a.id === 'surprise')?.prompt) },
      ]);
    }
    setIsQuickActionsOpen(!isQuickActionsOpen);
  };

  const handleSaveMessage = (text: string) => {
    setSavedItems(prev => {
      if (prev.some(item => item.text === text)) return prev;
      return [{ id: Date.now().toString(), text, timestamp: Date.now() }, ...prev];
    });
    triggerHaptic();
  };

  const createNewSession = (initialMessages: Message[], title: string) => {
    const newId = Date.now().toString();
    const newSession: ChatSession = { id: newId, title, date: new Date().toISOString(), timestamp: Date.now(), messages: initialMessages };
    if (!incognitoMode) {
       setSessions(prev => [newSession, ...prev]);
    }
    setCurrentSessionId(newId);
    return newId;
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    triggerHaptic();
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
           if (!incognitoMode) {
              setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, title } : s));
           }
        })
        .catch(err => console.error("Title generation failed", err));
        
    } else {
      setMessages(activeMessages);
      if (!incognitoMode) {
         setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: activeMessages } : s));
      }
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
          { 
             temperature, 
             maxOutputTokens, 
             topP,
             frequencyPenalty,
             presencePenalty,
             safetyLevel
          }
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
      if (!incognitoMode) {
         setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: finalMessages } : s));
      }
      
      if (soundEnabled) console.log("Beep");
      if (autoRead) {
         const utterance = new SpeechSynthesisUtterance(responseText);
         utterance.lang = 'tr-TR';
         utterance.rate = voiceSpeed;
         window.speechSynthesis.speak(utterance);
      }
      sendDesktopNotification(responseText);
      triggerHaptic();

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

  // Dynamic Background Classes
  const bgClass = backgroundStyle === 'gradient' 
    ? 'bg-gradient-to-br from-gray-900 to-black' 
    : backgroundStyle === 'particles' 
      ? 'bg-[url("https://grainy-gradients.vercel.app/noise.svg")] bg-gray-950' 
      : 'bg-black';

  return (
    <div className={`flex h-screen ${bgClass} overflow-hidden selection:${theme.text} selection:bg-gray-800 ${sidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row'} ${fontFamily} ${glassEffect ? 'backdrop-blur-sm' : ''}`}>
      {/* Privacy Shield Blur */}
      {isWindowBlurred && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center text-center p-10 animate-fade-in">
           <EyeOff size={64} className={`mb-4 ${theme.text}`} />
           <h2 className="text-2xl font-bold text-white mb-2">Gizlilik Kalkanı Aktif</h2>
           <p className="text-gray-400">Sohbet içeriği gizlendi. Devam etmek için ekrana tıklayın veya pencereye odaklanın.</p>
        </div>
      )}

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onNewChat={() => { setCurrentSessionId(null); setMessages([WELCOME_MESSAGE]); }}
        onDeleteHistory={() => { if(confirm("Silinsin mi?")) { setSessions([]); localStorage.removeItem(getScopedKey(STORAGE_KEYS.SESSIONS, currentUser.email)); } }}
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
              Td AI <span className={`text-xs px-1.5 rounded-full ${theme.iconBg} ${theme.text} border ${theme.border} border-opacity-30`}>v3.0</span>
              {incognitoMode && <Lock size={14} className="text-purple-500" />}
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

        <main className={`flex-1 overflow-y-auto pt-20 pb-4 px-2 md:px-4 scroll-smooth custom-scrollbar`}>
          <div className={`${chatWidth === 'full' ? 'max-w-full px-4' : 'max-w-3xl'} mx-auto space-y-6 min-h-[calc(100vh-180px)] transition-all duration-500 ease-smooth ${uiDensity === 'compact' ? 'space-y-3' : 'space-y-6'}`}>
            {messages.map((msg, idx) => (
              <div key={msg.id} className={messageAlignment === 'classic' && msg.role === 'model' ? 'mr-auto w-full' : ''}>
                <MessageItem 
                  message={msg} 
                  accentColor={accentColor} 
                  onSave={handleSaveMessage}
                  fontSize={fontSize}
                  typingEffect={typingEffect}
                  showAvatars={showAvatars}
                  timeFormat={timeFormat}
                  customUsername={username}
                  userAvatar={userAvatar}
                  borderRadius={borderRadius}
                  showLineNumbers={showLineNumbers}
                  latency={msg.role === 'model' && idx === messages.length - 1 && showLatency ? lastLatency : undefined}
                />
              </div>
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
            
            {/* Stats Footer if enabled */}
            {showTokenCount && (
              <div className="absolute -top-6 right-0 text-[10px] text-gray-600 font-mono bg-gray-900 px-2 py-0.5 rounded">
                 Tahmini: {messages.reduce((acc, m) => acc + m.text.length / 4, 0).toFixed(0)} token
              </div>
            )}

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
                spellCheck={spellcheck}
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
        borderRadius={borderRadius} onSaveBorderRadius={setBorderRadius}
        animationSpeed={animationSpeed} onSaveAnimationSpeed={setAnimationSpeed}
        showLineNumbers={showLineNumbers} onSaveShowLineNumbers={setShowLineNumbers}
        chatWidth={chatWidth} onSaveChatWidth={setChatWidth}
        sidebarPosition={sidebarPosition} onSaveSidebarPosition={setSidebarPosition}
        enterToSend={enterToSend} onSaveEnterToSend={setEnterToSend}
        typingEffect={typingEffect} onSaveTypingEffect={setTypingEffect}
        autoScroll={autoScroll} onSaveAutoScroll={setAutoScroll}
        notifications={notifications} onSaveNotifications={setNotifications}
        hapticFeedback={hapticFeedback} onSaveHapticFeedback={setHapticFeedback}
        temperature={temperature} onSaveTemperature={setTemperature}
        contextLimit={contextLimit} onSaveContextLimit={setContextLimit}
        maxOutputTokens={maxOutputTokens} onSaveMaxOutputTokens={setMaxOutputTokens}
        topP={topP} onSaveTopP={setTopP}
        frequencyPenalty={frequencyPenalty} onSaveFrequencyPenalty={setFrequencyPenalty}
        presencePenalty={presencePenalty} onSavePresencePenalty={setPresencePenalty}
        safetyLevel={safetyLevel} onSaveSafetyLevel={setSafetyLevel}
        username={username} onSaveUsername={setUsername}
        userAvatar={userAvatar} onSaveUserAvatar={setUserAvatar}
        incognitoMode={incognitoMode} onSaveIncognitoMode={setIncognitoMode}
        soundEnabled={soundEnabled} onSaveSoundEnabled={setSoundEnabled}
        showLatency={showLatency} onSaveShowLatency={setShowLatency}
        onResetData={handleResetData}
        onExportChat={handleExportChat}
        // Mega New Props
        uiDensity={uiDensity} onSaveUiDensity={setUiDensity}
        messageAlignment={messageAlignment} onSaveMessageAlignment={setMessageAlignment}
        backgroundStyle={backgroundStyle} onSaveBackgroundStyle={setBackgroundStyle}
        glassEffect={glassEffect} onSaveGlassEffect={setGlassEffect}
        blurOnLeave={blurOnLeave} onSaveBlurOnLeave={setBlurOnLeave}
        voiceSpeed={voiceSpeed} onSaveVoiceSpeed={setVoiceSpeed}
        autoRead={autoRead} onSaveAutoRead={setAutoRead}
        showTokenCount={showTokenCount} onSaveShowTokenCount={setShowTokenCount}
        debugMode={debugMode} onSaveDebugMode={setDebugMode}
        startPage={startPage} onSaveStartPage={setStartPage}
        spellcheck={spellcheck} onSaveSpellcheck={setSpellcheck}
      />
    </div>
  );
};

export default App;