
import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Video, Paperclip, Menu, AlertTriangle, X, Camera, StopCircle, Settings, Trash2, MoreVertical, Code, Palette, BookOpen, Lightbulb, Sparkles, Bookmark, Upload, Files, Check, Lock, EyeOff, ArrowDown, Eraser, Maximize2, Minimize2, Terminal, Zap, Activity, MessageSquare, AlertCircle, Info, Share2, Image as ImageIcon, Phone } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { MessageItem } from './components/MessageItem';
import { SettingsModal } from './components/SettingsModal';
import { LoginScreen } from './components/LoginScreen';
import { PrivacyModal } from './components/PrivacyModal';
import { LiveCallOverlay } from './components/LiveCallOverlay';
import { sendMessageToGemini, generateImageWithGemini, generateChatTitle } from './services/geminiService';
import { Message, ChatSession } from './types';
import { THEMES } from './utils/theme';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const DEFAULT_PERSONA = `Sen Td AI'sın. Türk toplumu gibi konuşan, samimi, 'kanka', 'abi', 'hocam' gibi hitapları yeri gelince kullanan, esprili ve zeki bir yapay zeka asistanısın.`;

// Storage Keys
const STORAGE_KEYS = {
  SESSIONS: 'tdai_sessions',
  PERSONA: 'tdai_persona',
  THEME: 'tdai_theme',
  USER: 'tdai_user', 
  LAST_SESSION_ID: 'tdai_last_session_id',
  SAVED_ITEMS: 'tdai_saved_items',
  PRIVACY_POLICY: 'tdai_privacy_accepted_v1', // New Key
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
  USER_AVATAR: 'tdai_user_avatar',
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
  SPELLCHECK: 'tdai_spellcheck',
  // Ultra New Settings
  STREAM_RESPONSE: 'tdai_stream_response',
  SHOW_TIMESTAMP: 'tdai_show_timestamp',
  HIGH_CONTRAST: 'tdai_high_contrast',
  EXPORT_FORMAT: 'tdai_export_format',
  // Laboratory & Ultimate Settings
  SIDEBAR_MODE: 'tdai_sidebar_mode',
  FONT_WEIGHT: 'tdai_font_weight',
  NOTIFICATION_SOUND: 'tdai_notif_sound',
  RESPONSE_STYLE: 'tdai_response_style',
  AUTO_TITLE: 'tdai_auto_title',
  RENDER_LATEX: 'tdai_render_latex',
  AUTO_DELETE: 'tdai_auto_delete'
};

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'model',
  text: "Merhaba! Ben Td AI. Sana nasıl yardımcı olabilirim?",
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

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Helper to get user-specific keys
const getScopedKey = (key: string, email?: string) => {
  if (!email) return key;
  return `${key}_${email}`;
};

const App: React.FC = () => {
  // --- Privacy Check ---
  const [isPrivacyAccepted, setIsPrivacyAccepted] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.PRIVACY_POLICY) === 'true';
  });

  // --- Auth State Initialization ---
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
  const [isImageMode, setIsImageMode] = useState(false);
  const [isLiveCallActive, setIsLiveCallActive] = useState(false);
  const [activeQuickTab, setActiveQuickTab] = useState<'suggestions' | 'saved'>('suggestions');
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [currentQuickActions, setCurrentQuickActions] = useState<QuickActionItem[]>([]);
  const [isHistoryCopied, setIsHistoryCopied] = useState(false);
  const [lastLatency, setLastLatency] = useState<number | undefined>(undefined);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // --- Settings State ---
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

  // AI Config
  const [contextLimit, setContextLimit] = useState<'low' | 'medium' | 'high'>(() => getInitialState(STORAGE_KEYS.CONTEXT_LIMIT, 'medium'));
  const [temperature, setTemperature] = useState(() => getInitialState(STORAGE_KEYS.TEMPERATURE, 0.7));
  const [username, setUsername] = useState(() => getInitialState(STORAGE_KEYS.USERNAME, 'Sen'));
  const [userAvatar, setUserAvatar] = useState<string | null>(() => getInitialState(STORAGE_KEYS.USER_AVATAR, null));
  const [maxOutputTokens, setMaxOutputTokens] = useState(() => getInitialState(STORAGE_KEYS.MAX_TOKENS, 4096));
  const [topP, setTopP] = useState(() => getInitialState(STORAGE_KEYS.TOP_P, 0.95));
  const [frequencyPenalty, setFrequencyPenalty] = useState(() => getInitialState(STORAGE_KEYS.FREQUENCY_PENALTY, 0));
  const [presencePenalty, setPresencePenalty] = useState(() => getInitialState(STORAGE_KEYS.PRESENCE_PENALTY, 0));
  const [safetyLevel, setSafetyLevel] = useState<'low' | 'medium' | 'high' | 'none'>(() => getInitialState(STORAGE_KEYS.SAFETY_LEVEL, 'none'));

  // Visuals
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

  // Mega Advanced Settings
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

  // Ultra New Settings
  const [streamResponse, setStreamResponse] = useState(() => getInitialState(STORAGE_KEYS.STREAM_RESPONSE, true));
  const [showTimestamp, setShowTimestamp] = useState(() => getInitialState(STORAGE_KEYS.SHOW_TIMESTAMP, true));
  const [highContrast, setHighContrast] = useState(() => getInitialState(STORAGE_KEYS.HIGH_CONTRAST, false));
  const [exportFormat, setExportFormat] = useState<'json' | 'txt' | 'md'>(() => getInitialState(STORAGE_KEYS.EXPORT_FORMAT, 'json'));

  // Laboratory & Ultimate Settings
  const [sidebarMode, setSidebarMode] = useState<'push' | 'overlay'>(() => getInitialState(STORAGE_KEYS.SIDEBAR_MODE, 'push'));
  const [fontWeight, setFontWeight] = useState<'light' | 'normal' | 'medium' | 'bold'>(() => getInitialState(STORAGE_KEYS.FONT_WEIGHT, 'normal'));
  const [notificationSound, setNotificationSound] = useState<'default' | 'subtle' | 'funky'>(() => getInitialState(STORAGE_KEYS.NOTIFICATION_SOUND, 'default'));
  const [responseStyle, setResponseStyle] = useState<'concise' | 'normal' | 'verbose'>(() => getInitialState(STORAGE_KEYS.RESPONSE_STYLE, 'normal'));
  const [autoTitle, setAutoTitle] = useState(() => getInitialState(STORAGE_KEYS.AUTO_TITLE, true));
  const [renderLatex, setRenderLatex] = useState(() => getInitialState(STORAGE_KEYS.RENDER_LATEX, false));
  const [autoDelete, setAutoDelete] = useState(() => getInitialState(STORAGE_KEYS.AUTO_DELETE, false));

  // --- Chat Data State ---
  const [sessions, setSessions] = useState<ChatSession[]>(() => getInitialState(STORAGE_KEYS.SESSIONS, []));
  
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    const scopedKey = getScopedKey(STORAGE_KEYS.LAST_SESSION_ID, userEmail);
    return localStorage.getItem(scopedKey) || null;
  });

  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => getInitialState(STORAGE_KEYS.SAVED_ITEMS, []));
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);

  // --- Persistence Effects ---
  const persist = (key: string, val: any) => {
    if (!currentUser) return;
    const scopedKey = getScopedKey(key, currentUser.email);
    localStorage.setItem(scopedKey, typeof val === 'object' ? JSON.stringify(val) : String(val));
  };

  useEffect(() => {
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
    if (incognitoMode) return;
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
    if (!incognitoMode) persist(STORAGE_KEYS.SESSIONS, sessions); 
  }, [sessions, incognitoMode, currentUser]);

  useEffect(() => { persist(STORAGE_KEYS.SAVED_ITEMS, savedItems); }, [savedItems, currentUser]);
  
  // All Settings Persistence
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
  
  // Advanced
  useEffect(() => persist(STORAGE_KEYS.BORDER_RADIUS, borderRadius), [borderRadius, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.ANIMATION_SPEED, animationSpeed), [animationSpeed, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.SHOW_LINE_NUMBERS, showLineNumbers), [showLineNumbers, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.FREQUENCY_PENALTY, frequencyPenalty), [frequencyPenalty, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.PRESENCE_PENALTY, presencePenalty), [presencePenalty, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.SAFETY_LEVEL, safetyLevel), [safetyLevel, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.INCOGNITO_MODE, incognitoMode), [incognitoMode, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.HAPTIC_FEEDBACK, hapticFeedback), [hapticFeedback, currentUser]);
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
  useEffect(() => persist(STORAGE_KEYS.STREAM_RESPONSE, streamResponse), [streamResponse, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.SHOW_TIMESTAMP, showTimestamp), [showTimestamp, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.HIGH_CONTRAST, highContrast), [highContrast, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.EXPORT_FORMAT, exportFormat), [exportFormat, currentUser]);

  // Ultimate Persistence
  useEffect(() => persist(STORAGE_KEYS.SIDEBAR_MODE, sidebarMode), [sidebarMode, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.FONT_WEIGHT, fontWeight), [fontWeight, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.NOTIFICATION_SOUND, notificationSound), [notificationSound, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.RESPONSE_STYLE, responseStyle), [responseStyle, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.AUTO_TITLE, autoTitle), [autoTitle, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.RENDER_LATEX, renderLatex), [renderLatex, currentUser]);
  useEffect(() => persist(STORAGE_KEYS.AUTO_DELETE, autoDelete), [autoDelete, currentUser]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickMenuRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  const hasApiKey = !!process.env.API_KEY;
  const theme = THEMES[accentColor] || THEMES.red;

  // Auto Scroll
  useEffect(() => {
    if (autoScroll) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingAttachment, autoScroll]);

  // Scroll Listener for Floating Button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
     const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
     const isNearBottom = scrollHeight - scrollTop - clientHeight < 300;
     setShowScrollButton(!isNearBottom);
  };

  // Notifications
  const sendDesktopNotification = (text: string) => {
    if (notifications && document.hidden && Notification.permission === "granted") {
      new Notification("Td AI", { body: text.substring(0, 100), icon: '/vite.svg' });
    }
  };
  
  useEffect(() => {
    if (notifications && Notification.permission !== "granted") Notification.requestPermission();
  }, [notifications]);

  const triggerHaptic = () => {
     if (hapticFeedback && navigator.vibrate) navigator.vibrate(50);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const handleAcceptPrivacy = () => {
    localStorage.setItem(STORAGE_KEYS.PRIVACY_POLICY, 'true');
    setIsPrivacyAccepted(true);
  };

  // --- Handlers ---
  const handleLogin = (email: string) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ email, isGuest: false }));
    window.location.reload();
  };

  const handleGuestAccess = () => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ email: 'Misafir Kullanıcı', isGuest: true }));
    window.location.reload();
  };

  const handleLogout = () => {
    if (window.confirm('Çıkış yapmak istediğinize emin misiniz?')) {
        localStorage.removeItem(STORAGE_KEYS.USER);
        setCurrentUser(null);
        window.location.href = '/';
    }
  };

  const handleExportChat = () => {
    const sessionTitle = sessions.find(s => s.id === currentSessionId)?.title || "Export";
    let content = '', mimeType = 'application/json', extension = 'json';

    if (exportFormat === 'json') {
        content = JSON.stringify({ sessionTitle, exportedAt: new Date().toISOString(), messages, settings: { persona, accentColor } }, null, 2);
        mimeType = 'application/json'; extension = 'json';
    } else if (exportFormat === 'txt') {
        content = messages.map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.role}: ${m.text}`).join('\n\n');
        mimeType = 'text/plain'; extension = 'txt';
    } else if (exportFormat === 'md') {
        content = `# ${sessionTitle}\n\n` + messages.map(m => `### ${m.role}\n${m.text}`).join('\n\n---\n\n');
        mimeType = 'text/markdown'; extension = 'md';
    }
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([content], { type: mimeType }));
    link.download = `tdai_chat.${extension}`;
    link.click();
    showToast("Sohbet dışa aktarıldı", "success");
  };

  const handleShareChat = async () => {
    const url = window.location.href;
    const shareData = {
      title: 'Td AI Chatbot',
      text: 'Td AI ile harika bir sohbet!',
      url: url
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        throw new Error("Web Share API unsupported");
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(url);
        showToast("Bağlantı kopyalandı", "success");
      } catch (e) {
        showToast("Paylaşım yapılamadı", "error");
      }
    }
  };

  const handleResetData = () => {
    if (!currentUser) return;
    const suffix = `_${currentUser.email}`;
    Object.keys(localStorage).forEach(key => { if (key.endsWith(suffix)) localStorage.removeItem(key); });
    window.location.reload();
  };

  const handleClearChat = () => {
     if(window.confirm('Mevcut sohbet ekranı temizlensin mi?')) {
        setMessages([WELCOME_MESSAGE]);
        showToast("Ekran temizlendi", "info");
     }
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
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("Tarayıcı desteklemiyor.");
    const recognition = new SR();
    recognition.lang = 'tr-TR';
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => {
      if (e.results[e.results.length - 1].isFinal) {
         setInput(p => p + (p ? ' ' : '') + e.results[e.results.length - 1][0].transcript);
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const processFile = (file: File) => {
    if (!SUPPORTED_MIME_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return alert("Geçersiz dosya.");
    const reader = new FileReader();
    reader.onload = (e) => setPendingAttachment({
        data: e.target?.result as string, file, type: file.type.startsWith('video/') ? 'video' : 'image',
        name: file.name, size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
    });
    reader.readAsDataURL(file);
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      setIsVideoOpen(true);
    } catch (err) { alert("Kamera izni gerekli."); }
  };

  const captureToAttachment = () => {
    triggerHaptic();
    if (!videoRef.current || !canvasRef.current) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    canvasRef.current.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    setPendingAttachment({ data: canvasRef.current.toDataURL('image/jpeg', 0.8), file: null, type: 'image', name: `Kamera_${Date.now()}.jpg`, size: 'Live' });
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsVideoOpen(false);
  };

  const toggleQuickMenu = () => {
    triggerHaptic();
    if (!isQuickActionsOpen) {
      const getPrompt = (cat: string) => QUICK_PROMPT_OPTIONS[cat as keyof typeof QUICK_PROMPT_OPTIONS][Math.floor(Math.random() * QUICK_PROMPT_OPTIONS[cat as keyof typeof QUICK_PROMPT_OPTIONS].length)];
      setCurrentQuickActions([
        { id: 'code', label: 'Kod', icon: Code, prompt: getPrompt('code') },
        { id: 'image', label: 'Görsel', icon: Palette, prompt: getPrompt('image') },
        { id: 'lesson', label: 'Ders', icon: BookOpen, prompt: getPrompt('lesson') },
        { id: 'idea', label: 'Fikir', icon: Lightbulb, prompt: getPrompt('idea') },
        { id: 'surprise', label: 'Şaşırt', icon: Sparkles, prompt: getPrompt('surprise') },
      ]);
    }
    setIsQuickActionsOpen(!isQuickActionsOpen);
  };

  const handleSend = async (e?: React.FormEvent, overrideText?: string) => {
    e?.preventDefault();
    triggerHaptic();
    
    const textToSend = overrideText !== undefined ? overrideText : input;
    const hasText = textToSend.trim().length > 0;
    const attachedData = pendingAttachment?.data;
    if ((!hasText && !attachedData) || isLoading || !hasApiKey) return;

    const userText = textToSend.trim();
    const finalText = userText || (attachedData ? (pendingAttachment.type === 'video' ? "Videoyu analiz et." : "Resmi analiz et.") : "");
    
    setInput('');
    setPendingAttachment(null);
    if (textareaRef.current) textareaRef.current.style.height = '48px';

    // Determine if we are in image generation mode
    let isImageGeneration = isImageMode;
    let promptForAI = finalText;

    // Fallback to legacy text command if mode is off
    if (!isImageGeneration && !attachedData && finalText.toLowerCase().startsWith('resim çiz')) {
      isImageGeneration = true;
      // Strip the command for cleaner prompt if possible, but keep it simple for now or just pass full
      // Ideally: promptForAI = finalText.replace(/^resim çiz\s*/i, '');
    }

    // If explicit image mode and no prompt text, maybe warn? But we checked hasText
    if (isImageGeneration && promptForAI.trim() === '') promptForAI = finalText; 

    const newUserMessage: Message = { id: Date.now().toString(), role: 'user', text: finalText, image: attachedData, mediaType: pendingAttachment?.type, timestamp: Date.now() };
    let activeMessages = currentSessionId ? [...messages, newUserMessage] : [newUserMessage]; 
    let activeSessionId = currentSessionId;

    if (!activeSessionId) {
      setMessages(activeMessages);
      setIsLoading(true);
      activeSessionId = Date.now().toString();
      const newSession: ChatSession = { id: activeSessionId, title: "Yeni Sohbet...", date: new Date().toISOString(), timestamp: Date.now(), messages: activeMessages };
      if (!incognitoMode) setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(activeSessionId);
      
      if (autoTitle) {
        generateChatTitle(finalText).then(title => {
           if (!incognitoMode) setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, title } : s));
        });
      }
    } else {
      setMessages(activeMessages);
      if (!incognitoMode) setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: activeMessages } : s));
      setIsLoading(true);
    }

    try {
      const startTime = Date.now();
      let responseText = "";
      let generatedImage = undefined;
      
      let modifiedPersona = persona;
      if (responseStyle === 'concise') modifiedPersona += " Cevapların çok kısa, öz ve net olsun.";
      if (responseStyle === 'verbose') modifiedPersona += " Cevapların çok detaylı, açıklayıcı ve kapsamlı olsun.";

      if (!attachedData && isImageGeneration) {
        // Remove the trigger prefix if it exists to give the model a cleaner prompt
        // Update regex to include potential colon
        const cleanPrompt = promptForAI.replace(/^resim çiz[:\s]*/i, '');
        const finalImagePrompt = cleanPrompt || promptForAI;

        generatedImage = await generateImageWithGemini(finalImagePrompt);
        responseText = `Görsel oluşturuldu: ${finalImagePrompt}`;
      } else {
        responseText = await sendMessageToGemini(finalText, activeMessages.slice(0, -1).map(m => ({ role: m.role, parts: [{ text: m.text }] })), attachedData, modifiedPersona, { temperature, maxOutputTokens, topP, frequencyPenalty, presencePenalty, safetyLevel });
      }

      setLastLatency(Date.now() - startTime);
      const newModelMessage: Message = { id: Date.now().toString(), role: 'model', text: responseText, image: generatedImage, mediaType: generatedImage ? 'image' : undefined, timestamp: Date.now() };
      const finalMessages = [...activeMessages, newModelMessage];
      setMessages(finalMessages);
      if (!incognitoMode) setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: finalMessages } : s));
      
      if (soundEnabled) {
         // Placeholder sound logic
      }
      if (autoRead) {
         const utterance = new SpeechSynthesisUtterance(responseText);
         utterance.lang = 'tr-TR'; utterance.rate = voiceSpeed;
         window.speechSynthesis.speak(utterance);
      }
      sendDesktopNotification(responseText);
      triggerHaptic();

    } catch (error: any) {
      setMessages([...activeMessages, { id: Date.now().toString(), role: 'model', text: error.message || "Hata.", timestamp: Date.now() }]);
      showToast("Mesaj gönderilemedi", "error");
    } finally {
      setIsLoading(false);
      if (isImageMode) setIsImageMode(false); // Turn off image mode after sending
    }
  };

  const handleRegenerate = () => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    const secondLastMessage = messages.length > 1 ? messages[messages.length - 2] : null;

    if (lastMessage.role === 'model' && secondLastMessage && secondLastMessage.role === 'user') {
      const newMessages = messages.slice(0, -1);
      setMessages(newMessages);
      handleSend(undefined, secondLastMessage.text);
    }
  };

  const handleEditMessage = (oldText: string) => {
    const index = messages.findIndex(m => m.role === 'user' && m.text === oldText);
    if (index !== -1) {
      // Keep messages up to this point, excluding this user message and anything after
      const newHistory = messages.slice(0, index);
      setMessages(newHistory);
      setInput(oldText);
      textareaRef.current?.focus();
    }
  };

  const handleStopGeneration = () => {
    setIsLoading(false); // Logic simulated, as real stream abort needs AbortController ref
    showToast("İşlem durduruldu", "info");
  };

  // Global Shortcuts Effect - Moved to end to capture handlers in closure
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentUser) return;

      const isCmd = e.metaKey || e.ctrlKey;

      // Open Settings: Ctrl + / or Ctrl + .
      if (isCmd && (e.key === '/' || e.key === '.')) {
        e.preventDefault();
        setIsSettingsOpen(prev => !prev);
      }

      // Toggle Sidebar: Ctrl + B
      if (isCmd && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }

      // New Chat: Ctrl + K
      if (isCmd && e.key === 'k') {
        e.preventDefault();
        setCurrentSessionId(null);
        setMessages([WELCOME_MESSAGE]);
        textareaRef.current?.focus();
      }

      // Clear Chat: Ctrl + L
      if (isCmd && e.key === 'l') {
        e.preventDefault();
        if (messages.length > 1) handleClearChat();
      }

      // Save/Export: Ctrl + S
      if (isCmd && e.key === 's') {
        e.preventDefault();
        handleExportChat();
      }

      // Focus Mode: Ctrl + F
      if (isCmd && e.key === 'f') {
        e.preventDefault();
        setIsFocusMode(prev => !prev);
      }

      // Mic Toggle: Ctrl + M
      if (isCmd && e.key === 'm') {
        e.preventDefault();
        toggleListening();
      }

      // Regenerate: Ctrl + R
      if (isCmd && e.key === 'r') {
        e.preventDefault();
        handleRegenerate();
      }

      // Jump to Bottom: Ctrl + J
      if (isCmd && e.key === 'j') {
        e.preventDefault();
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }

      // Quick Menu: Ctrl + H
      if (isCmd && e.key === 'h') {
        e.preventDefault();
        toggleQuickMenu();
      }
      
      // Escape to close everything
      if (e.key === 'Escape') {
        if (isSettingsOpen) setIsSettingsOpen(false);
        else if (isSidebarOpen) setSidebarOpen(false);
        else if (isVideoOpen) setIsVideoOpen(false);
        else if (isQuickActionsOpen) setIsQuickActionsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser, isSettingsOpen, isSidebarOpen, isVideoOpen, isQuickActionsOpen, messages.length, handleExportChat, toggleListening, handleRegenerate, handleClearChat]);


  // --- Render Logic ---

  // 1. Check Privacy Policy First
  if (!isPrivacyAccepted) {
    return <PrivacyModal onAccept={handleAcceptPrivacy} />;
  }

  // 2. Check Authentication
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} onGuestAccess={handleGuestAccess} accentColor={accentColor} />;
  }

  const bgClass = backgroundStyle === 'gradient' ? 'bg-gradient-to-br from-gray-900 to-black' : backgroundStyle === 'particles' ? 'bg-[url("https://grainy-gradients.vercel.app/noise.svg")] bg-gray-950' : 'bg-black';
  const fontWeightClass = fontWeight === 'light' ? 'font-light' : fontWeight === 'medium' ? 'font-medium' : fontWeight === 'bold' ? 'font-bold' : 'font-normal';

  return (
    <div className={`flex h-screen ${bgClass} overflow-hidden ${sidebarPosition === 'right' ? 'flex-row-reverse' : 'flex-row'} ${fontFamily} ${fontWeightClass} ${glassEffect && !highContrast ? 'backdrop-blur-sm' : ''} ${highContrast ? 'contrast-125 saturate-110' : ''}`}>
      {isWindowBlurred && <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-10"><EyeOff size={64} className="text-white mb-4"/><h2 className="text-2xl text-white">Gizli</h2></div>}

      {/* Live Call Overlay */}
      {isLiveCallActive && (
        <LiveCallOverlay 
          onClose={() => setIsLiveCallActive(false)} 
          apiKey={process.env.API_KEY || ''} 
          persona={persona}
        />
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium text-white animate-slide-up-fade ${toast.type === 'error' ? 'bg-red-600' : toast.type === 'success' ? 'bg-green-600' : 'bg-gray-800 border border-gray-700'}`}>
             {toast.type === 'error' ? <AlertCircle size={16}/> : toast.type === 'success' ? <Check size={16}/> : <Info size={16}/>}
             {toast.message}
          </div>
        ))}
      </div>

      <div className={`${isFocusMode ? 'hidden' : 'block'} lg:block ${isFocusMode ? 'lg:hidden' : ''}`}>
         <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            onNewChat={() => { setCurrentSessionId(null); setMessages([WELCOME_MESSAGE]); }}
            onDeleteHistory={() => { if(confirm("Sil?")) { setSessions([]); localStorage.removeItem(getScopedKey(STORAGE_KEYS.SESSIONS, currentUser.email)); } }}
            accentColor={accentColor} currentUser={currentUser} onLogout={handleLogout} sessions={sessions} currentSessionId={currentSessionId} onSelectSession={setCurrentSessionId}
         />
      </div>

      <div className={`flex-1 flex flex-col h-full relative w-full transition-all ${sidebarMode === 'push' && isSidebarOpen ? 'lg:ml-0' : ''}`}>
        <header className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md z-10 absolute top-0 left-0 right-0">
          <div className={`flex items-center gap-3 ${sidebarPosition === 'right' ? 'flex-row-reverse' : ''}`}>
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400"><Menu size={24} /></button>
            <button onClick={() => setIsFocusMode(!isFocusMode)} className="hidden lg:block text-gray-400 hover:text-white p-1" title={isFocusMode ? "Odak Modundan Çık" : "Odak Modu"}>
               {isFocusMode ? <Minimize2 size={20}/> : <Maximize2 size={20}/>}
            </button>
            <h1 className="text-lg font-semibold text-white flex items-center gap-2">Td AI <span className={`text-xs px-1.5 rounded-full ${theme.iconBg} ${theme.text}`}>v5.2</span></h1>
          </div>
          <div className="flex items-center gap-2">
            {!hasApiKey && <div className="text-yellow-500 text-xs flex items-center gap-1"><AlertTriangle size={12} /> API Yok</div>}
            <button onClick={() => setIsLiveCallActive(true)} className={`p-2 ${theme.text} hover:bg-gray-900 rounded-full transition-all`} title="Görüntülü Arama"><Phone size={20}/></button>
            <button onClick={handleShareChat} className="p-2 text-gray-400 hover:text-blue-400 transition-all" title="Paylaş"><Share2 size={20}/></button>
            <button onClick={handleClearChat} className="p-2 text-gray-400 hover:text-red-400 transition-all" title="Sohbeti Temizle"><Eraser size={20}/></button>
            <button onClick={() => { navigator.clipboard.writeText(messages.map(m => `${m.role}: ${m.text}`).join('\n\n')); setIsHistoryCopied(true); setTimeout(() => setIsHistoryCopied(false), 2000); showToast("Geçmiş kopyalandı", "success"); }} className="p-2 text-gray-400 hover:text-white transition-all" title="Geçmişi Kopyala">{isHistoryCopied ? <Check size={20}/> : <Files size={20}/>}</button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-400 hover:text-white transition-all" title="Ayarlar"><Settings size={20} /></button>
          </div>
        </header>

        <main ref={mainContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto pt-20 pb-4 px-2 md:px-4 scroll-smooth custom-scrollbar">
          <div className={`${chatWidth === 'full' ? 'max-w-full px-4' : 'max-w-3xl'} mx-auto space-y-6 min-h-[calc(100vh-180px)] flex flex-col ${uiDensity === 'compact' ? 'space-y-3' : 'space-y-6'}`}>
            
            {/* Empty State Dashboard */}
            {messages.length <= 1 && (
               <div className="flex-1 flex flex-col justify-center items-center animate-fade-in pb-10">
                  <div className="text-center mb-8">
                     <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-800 to-black border border-gray-700 flex items-center justify-center shadow-2xl ${theme.text}`}>
                        <Sparkles size={40} />
                     </div>
                     <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Bugün ne yapalım?</h2>
                     <p className="text-gray-400">Aşağıdaki önerilerden birini seç veya yazmaya başla.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                     {[
                        { icon: Terminal, title: 'Kodlama', desc: 'React ile bir bileşen yaz', prompt: 'React ve Tailwind kullanarak modern bir kart bileşeni yaz.' },
                        { icon: Palette, title: 'Tasarım', desc: 'Bir logo fikri ver', prompt: 'Resim çiz: Teknoloji şirketi için minimalist bir logo.' },
                        { icon: BookOpen, title: 'Öğren', desc: 'Kuantum fiziğini anlat', prompt: 'Kuantum fiziğini 5 yaşında birine anlatır gibi özetle.' },
                        { icon: Zap, title: 'Analiz', desc: 'Bu metni özetle', prompt: 'Şu metni maddeler halinde özetle: ' }
                     ].map((card, idx) => (
                        <button key={idx} onClick={() => setInput(card.prompt)} className="flex items-center gap-4 p-4 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-gray-600 hover:bg-gray-900 transition-all text-left group">
                           <div className={`p-3 rounded-lg bg-gray-800 group-hover:scale-110 transition-transform ${theme.text}`}><card.icon size={20}/></div>
                           <div><div className="font-bold text-white text-sm">{card.title}</div><div className="text-xs text-gray-500">{card.desc}</div></div>
                        </button>
                     ))}
                  </div>
               </div>
            )}

            {messages.length > 0 && messages.map((msg, idx) => (
              <div key={msg.id} className={messageAlignment === 'classic' && msg.role === 'model' ? 'mr-auto w-full' : ''}>
                <MessageItem 
                  message={msg} accentColor={accentColor} onSave={t => { setSavedItems(p => [{ id: Date.now().toString(), text: t, timestamp: Date.now() }, ...p]); showToast("Mesaj kaydedildi", "success"); }}
                  fontSize={fontSize} typingEffect={typingEffect} showAvatars={showAvatars} timeFormat={timeFormat} customUsername={username} userAvatar={userAvatar}
                  borderRadius={borderRadius} showLineNumbers={showLineNumbers} latency={msg.role === 'model' && idx === messages.length - 1 && showLatency ? lastLatency : undefined}
                  showTimestamp={showTimestamp}
                  isLast={idx === messages.length - 1}
                  onRegenerate={msg.role === 'model' ? handleRegenerate : undefined}
                  onEdit={msg.role === 'user' ? handleEditMessage : undefined}
                />
              </div>
            ))}
            {isLoading && <div className="flex gap-2 pl-4"><div className={`w-2 h-2 ${theme.primary} rounded-full animate-bounce`}></div><div className={`w-2 h-2 ${theme.primary} rounded-full animate-bounce delay-75`}></div><div className={`w-2 h-2 ${theme.primary} rounded-full animate-bounce delay-150`}></div></div>}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </main>

        {/* Floating Scroll Button */}
        <button 
           onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })} 
           className={`fixed bottom-28 right-6 p-3 rounded-full shadow-xl z-40 bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 transition-all duration-300 ${showScrollButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
           <ArrowDown size={20} />
        </button>

        <div className="p-4 bg-black/80 backdrop-blur-md border-t border-gray-800/50">
          <div className={`${chatWidth === 'full' ? 'max-w-5xl' : 'max-w-3xl'} mx-auto relative`}>
            {showTokenCount && <div className="absolute -top-6 right-0 text-[10px] text-gray-600 bg-gray-900 px-2 rounded">~{messages.reduce((acc, m) => acc + m.text.length / 4, 0).toFixed(0)} tokens</div>}
            {isQuickActionsOpen && (
              <div ref={quickMenuRef} className="absolute bottom-full left-0 mb-3 w-72 bg-gray-900/95 backdrop-blur border border-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-80 animate-scale-in z-20">
                <div className="flex border-b border-gray-800">
                  <button onClick={() => setActiveQuickTab('suggestions')} className={`flex-1 py-2 text-xs font-bold ${activeQuickTab === 'suggestions' ? theme.text : 'text-gray-500'}`}>ÖNERİLER</button>
                  <button onClick={() => setActiveQuickTab('saved')} className={`flex-1 py-2 text-xs font-bold ${activeQuickTab === 'saved' ? theme.text : 'text-gray-500'}`}>KAYITLAR</button>
                </div>
                <div className="flex-1 overflow-y-auto p-1">
                   {activeQuickTab === 'suggestions' 
                      ? currentQuickActions.map(a => <button key={a.id} onClick={() => { setInput(a.prompt); setIsQuickActionsOpen(false); }} className="flex gap-2 p-2.5 w-full hover:bg-gray-800 rounded text-left text-sm text-gray-300 items-center"><a.icon size={14} className={theme.text} />{a.label}</button>)
                      : savedItems.map(s => <button key={s.id} onClick={() => { setInput(s.text); setIsQuickActionsOpen(false); }} className="p-2.5 w-full hover:bg-gray-800 rounded text-left text-sm text-gray-300 truncate">{s.text}</button>)
                   }
                </div>
              </div>
            )}

            {pendingAttachment && (
              <div className="absolute bottom-full left-0 right-0 mb-4 mx-4 bg-gray-900 p-3 rounded-2xl flex items-center gap-4 shadow-2xl border border-gray-700 animate-slide-up-fade">
                <div className="h-12 w-12 bg-black rounded overflow-hidden">{pendingAttachment.type === 'video' ? <video src={pendingAttachment.data} className="h-full w-full object-cover"/> : <img src={pendingAttachment.data} className="h-full w-full object-cover"/>}</div>
                <div className="flex-1"><h4 className="text-sm font-bold text-white truncate">{pendingAttachment.name}</h4><span className="text-xs text-gray-500">{pendingAttachment.size}</span></div>
                <button onClick={() => setPendingAttachment(null)} className="p-2 hover:text-red-400"><X size={18}/></button>
              </div>
            )}

            <form onSubmit={handleSend} className={`relative flex items-end gap-2 bg-gray-900/50 border border-gray-700 p-2 rounded-2xl transition-all duration-300 ${theme.ring} ${isImageMode ? 'ring-2 ring-purple-500/50 bg-purple-950/10 border-purple-500/30' : ''}`}>
              <div className="flex items-center pb-1 gap-1">
                <button type="button" onClick={toggleQuickMenu} className={`p-2 text-gray-400 hover:text-white transition-all ${isQuickActionsOpen ? theme.text : ''}`}><MoreVertical size={20}/></button>
                <div className="w-px h-5 bg-gray-700 mx-1"></div>
                <input type="file" ref={fileInputRef} onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" accept={SUPPORTED_MIME_TYPES.join(',')} />
                
                <button type="button" onClick={() => { setIsImageMode(!isImageMode); if(!isImageMode) showToast("Görsel Modu Açık", "info"); else showToast("Görsel Modu Kapalı", "info"); }} className={`p-2 transition-all ${isImageMode ? 'text-purple-400 bg-purple-400/10 rounded-lg' : 'text-gray-400 hover:text-white'}`} title="Görsel Oluşturma Modu"><ImageIcon size={20}/></button>

                <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-2 hover:text-white transition-all ${pendingAttachment ? theme.text : 'text-gray-400'}`}><Paperclip size={20}/></button>
                <button type="button" onClick={startVideo} className="p-2 text-gray-400 hover:text-white transition-all"><Camera size={20}/></button>
              </div>
              <textarea ref={textareaRef} value={input} spellCheck={spellcheck} onChange={handleInputChange} onKeyDown={e => { if(e.key === 'Enter' && enterToSend && !e.shiftKey) { e.preventDefault(); handleSend(); }}} placeholder={pendingAttachment ? "Medya..." : isImageMode ? "Görseli tarif et..." : `Mesaj yaz ${username}...`} className={`flex-1 bg-transparent text-white placeholder-gray-500 p-2.5 min-h-[48px] max-h-[160px] resize-none focus:outline-none ${fontSize === 'large' ? 'text-lg' : fontSize === 'xl' ? 'text-xl' : 'text-sm'}`} rows={1} />
              <div className="absolute bottom-2 right-14 text-[10px] text-gray-600 font-mono pointer-events-none bg-gray-900/80 px-1 rounded">{input.length}</div>
              <div className="flex items-center pb-1 gap-1">
                 <button type="button" onClick={toggleListening} className={`p-2 rounded-full ${isListening ? 'bg-red-600 text-white animate-pulse' : 'text-gray-400 hover:text-white'}`}>{isListening ? <StopCircle size={20}/> : <Mic size={20}/>}</button>
                 {isLoading ? (
                    <button type="button" onClick={handleStopGeneration} className="p-2 rounded-full bg-red-900/50 text-red-500 hover:bg-red-900 animate-pulse"><StopCircle size={20}/></button>
                 ) : (
                    <button type="submit" disabled={(!input.trim() && !pendingAttachment) || isLoading} className={`p-2 rounded-full transition-all ${ (input.trim() || pendingAttachment) && !isLoading ? `${isImageMode ? 'bg-purple-600 hover:bg-purple-500' : theme.primary} text-white` : 'bg-gray-800 text-gray-500' }`}><Send size={20}/></button>
                 )}
              </div>
            </form>
          </div>
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}
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
        onResetData={handleResetData} onExportChat={handleExportChat}
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
        streamResponse={streamResponse} onSaveStreamResponse={setStreamResponse}
        showTimestamp={showTimestamp} onSaveShowTimestamp={setShowTimestamp}
        highContrast={highContrast} onSaveHighContrast={setHighContrast}
        exportFormat={exportFormat} onSaveExportFormat={setExportFormat}
        
        // Passing New Laboratory Props
        sidebarMode={sidebarMode} onSaveSidebarMode={setSidebarMode}
        fontWeight={fontWeight} onSaveFontWeight={setFontWeight}
        notificationSound={notificationSound} onSaveNotificationSound={setNotificationSound}
        responseStyle={responseStyle} onSaveResponseStyle={setResponseStyle}
        autoTitle={autoTitle} onSaveAutoTitle={setAutoTitle}
        renderLatex={renderLatex} onSaveRenderLatex={setRenderLatex}
        autoDelete={autoDelete} onSaveAutoDelete={setAutoDelete}
      />
    </div>
  );
};

export default App;
