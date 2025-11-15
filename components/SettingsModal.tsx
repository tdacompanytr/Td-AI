
import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Type, Keyboard, Zap, Monitor, Sliders, Volume2, Trash2, Info, ShieldAlert, Layout, Maximize, Minimize, Cpu, ArrowDownCircle, UserCircle, Bell, Clock, Activity, Download, Settings, DownloadCloud, Lock, Eye, EyeOff, Hash, MousePointerClick, Globe, Sparkles, Fingerprint, Circle, Mic2, Speaker, Music, Layers, Palette, Box, Shield, Terminal, Command, Camera, FileText, Moon, Sun, Beaker, Sidebar, MessageSquare, Scale, LifeBuoy, Mail, Copy, Code, Image as ImageIcon, Sigma } from 'lucide-react';
import { THEMES } from '../utils/theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Persona
  currentPersona: string;
  onSavePersona: (persona: string) => void;
  
  // Visuals
  currentColor: string;
  onSaveColor: (color: string) => void;
  fontSize: 'normal' | 'large' | 'xl';
  onSaveFontSize: (size: 'normal' | 'large' | 'xl') => void;
  fontFamily?: string;
  onSaveFontFamily?: (font: string) => void;
  showAvatars: boolean;
  onSaveShowAvatars: (show: boolean) => void;
  timeFormat: '12h' | '24h';
  onSaveTimeFormat: (fmt: '12h' | '24h') => void;
  borderRadius: 'small' | 'medium' | 'large' | 'full';
  onSaveBorderRadius: (radius: 'small' | 'medium' | 'large' | 'full') => void;
  animationSpeed: 'slow' | 'normal' | 'fast';
  onSaveAnimationSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
  showLineNumbers: boolean;
  onSaveShowLineNumbers: (show: boolean) => void;
  
  // Layout
  chatWidth: 'normal' | 'full';
  onSaveChatWidth: (width: 'normal' | 'full') => void;
  sidebarPosition: 'left' | 'right';
  onSaveSidebarPosition: (pos: 'left' | 'right') => void;

  // Behavior
  enterToSend: boolean;
  onSaveEnterToSend: (enabled: boolean) => void;
  typingEffect: boolean;
  onSaveTypingEffect: (enabled: boolean) => void;
  autoScroll: boolean;
  onSaveAutoScroll: (enabled: boolean) => void;
  notifications: boolean;
  onSaveNotifications: (enabled: boolean) => void;
  hapticFeedback: boolean;
  onSaveHapticFeedback: (enabled: boolean) => void;
  
  // AI Config
  temperature: number;
  onSaveTemperature: (temp: number) => void;
  contextLimit: 'low' | 'medium' | 'high';
  onSaveContextLimit: (limit: 'low' | 'medium' | 'high') => void;
  maxOutputTokens: number;
  onSaveMaxOutputTokens: (tokens: number) => void;
  topP: number;
  onSaveTopP: (val: number) => void;
  frequencyPenalty: number;
  onSaveFrequencyPenalty: (val: number) => void;
  presencePenalty: number;
  onSavePresencePenalty: (val: number) => void;
  safetyLevel: 'low' | 'medium' | 'high' | 'none';
  onSaveSafetyLevel: (level: 'low' | 'medium' | 'high' | 'none') => void;
  
  // Identity & Privacy
  username: string;
  onSaveUsername: (name: string) => void;
  userAvatar?: string | null;
  onSaveUserAvatar?: (avatar: string | null) => void;
  incognitoMode: boolean;
  onSaveIncognitoMode: (enabled: boolean) => void;

  // Sound & System
  soundEnabled: boolean;
  onSaveSoundEnabled: (enabled: boolean) => void;
  showLatency: boolean;
  onSaveShowLatency: (enabled: boolean) => void;
  
  // Actions
  onResetData: () => void;
  onExportChat: () => void;

  // Mega New Props
  uiDensity: 'compact' | 'comfortable';
  onSaveUiDensity: (d: 'compact' | 'comfortable') => void;
  messageAlignment: 'modern' | 'classic';
  onSaveMessageAlignment: (a: 'modern' | 'classic') => void;
  backgroundStyle: 'solid' | 'gradient' | 'particles';
  onSaveBackgroundStyle: (s: 'solid' | 'gradient' | 'particles') => void;
  glassEffect: boolean;
  onSaveGlassEffect: (e: boolean) => void;
  blurOnLeave: boolean;
  onSaveBlurOnLeave: (e: boolean) => void;
  voiceSpeed: number;
  onSaveVoiceSpeed: (s: number) => void;
  autoRead: boolean;
  onSaveAutoRead: (e: boolean) => void;
  showTokenCount: boolean;
  onSaveShowTokenCount: (e: boolean) => void;
  debugMode: boolean;
  onSaveDebugMode: (e: boolean) => void;
  startPage: 'chat' | 'new' | 'history';
  onSaveStartPage: (p: 'chat' | 'new' | 'history') => void;
  spellcheck: boolean;
  onSaveSpellcheck: (e: boolean) => void;

  // Ultra New Props
  streamResponse: boolean;
  onSaveStreamResponse: (e: boolean) => void;
  showTimestamp: boolean;
  onSaveShowTimestamp: (e: boolean) => void;
  highContrast: boolean;
  onSaveHighContrast: (e: boolean) => void;
  exportFormat: 'json' | 'txt' | 'md';
  onSaveExportFormat: (f: 'json' | 'txt' | 'md') => void;

  // Laboratory Props
  sidebarMode: 'push' | 'overlay';
  onSaveSidebarMode: (m: 'push' | 'overlay') => void;
  fontWeight: 'light' | 'normal' | 'medium' | 'bold';
  onSaveFontWeight: (w: 'light' | 'normal' | 'medium' | 'bold') => void;
  notificationSound: 'default' | 'subtle' | 'funky';
  onSaveNotificationSound: (s: 'default' | 'subtle' | 'funky') => void;
  responseStyle: 'concise' | 'normal' | 'verbose';
  onSaveResponseStyle: (s: 'concise' | 'normal' | 'verbose') => void;
  autoTitle: boolean;
  onSaveAutoTitle: (e: boolean) => void;
  renderLatex: boolean;
  onSaveRenderLatex: (e: boolean) => void;
  autoDelete: boolean;
  onSaveAutoDelete: (e: boolean) => void;
}

const fontOptions = [
  { id: 'font-sans', name: 'Modern', desc: 'Inter', url: 'https://fonts.google.com/specimen/Inter' },
  { id: 'font-open', name: 'Standart', desc: 'Open Sans', url: 'https://fonts.google.com/specimen/Open+Sans' },
  { id: 'font-roboto', name: 'Düz', desc: 'Roboto', url: 'https://fonts.google.com/specimen/Roboto' },
  { id: 'font-montserrat', name: 'Şık', desc: 'Montserrat', url: 'https://fonts.google.com/specimen/Montserrat' },
  { id: 'font-poppins', name: 'Geometrik', desc: 'Poppins', url: 'https://fonts.google.com/specimen/Poppins' },
  { id: 'font-raleway', name: 'İnce', desc: 'Raleway', url: 'https://fonts.google.com/specimen/Raleway' },
  { id: 'font-nunito', name: 'Yuvarlak', desc: 'Nunito', url: 'https://fonts.google.com/specimen/Nunito' },
  { id: 'font-lato', name: 'Okunaklı', desc: 'Lato', url: 'https://fonts.google.com/specimen/Lato' },
  { id: 'font-serif', name: 'Klasik', desc: 'Playfair', url: 'https://fonts.google.com/specimen/Playfair+Display' },
  { id: 'font-merriweather', name: 'Gazete', desc: 'Merriweather', url: 'https://fonts.google.com/specimen/Merriweather' },
  { id: 'font-lora', name: 'Roman', desc: 'Lora', url: 'https://fonts.google.com/specimen/Lora' },
  { id: 'font-cinzel', name: 'Sinematik', desc: 'Cinzel', url: 'https://fonts.google.com/specimen/Cinzel' },
  { id: 'font-mono', name: 'Kod', desc: 'Fira Code', url: 'https://fonts.google.com/specimen/Fira+Code' },
  { id: 'font-jetbrains', name: 'Terminal', desc: 'JetBrains', url: 'https://fonts.google.com/specimen/JetBrains+Mono' },
  { id: 'font-space', name: 'Teknik', desc: 'Space Mono', url: 'https://fonts.google.com/specimen/Space+Mono' },
  { id: 'font-oswald', name: 'Poster', desc: 'Oswald', url: 'https://fonts.google.com/specimen/Oswald' },
  { id: 'font-righteous', name: 'Modernist', desc: 'Righteous', url: 'https://fonts.google.com/specimen/Righteous' },
  { id: 'font-orbitron', name: 'Sci-Fi', desc: 'Orbitron', url: 'https://fonts.google.com/specimen/Orbitron' },
  { id: 'font-pacifico', name: 'El Yazısı', desc: 'Pacifico', url: 'https://fonts.google.com/specimen/Pacifico' },
  { id: 'font-dancing', name: 'Davetiye', desc: 'Dancing', url: 'https://fonts.google.com/specimen/Dancing+Script' },
  { id: 'font-pixel', name: '8-Bit', desc: 'Retro', url: 'https://fonts.google.com/specimen/Press+Start+2P' },
];

const PRESET_AVATARS = [
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23EF4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%233B82F6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2310B981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23F59E0B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E",
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%238B5CF6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E"
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, currentPersona, onSavePersona, currentColor, onSaveColor, fontSize, onSaveFontSize, 
  fontFamily = 'font-sans', onSaveFontFamily,
  showAvatars, onSaveShowAvatars, timeFormat, onSaveTimeFormat, borderRadius, onSaveBorderRadius, animationSpeed, onSaveAnimationSpeed, showLineNumbers, onSaveShowLineNumbers,
  chatWidth, onSaveChatWidth, sidebarPosition, onSaveSidebarPosition, enterToSend, onSaveEnterToSend, typingEffect, onSaveTypingEffect, autoScroll, onSaveAutoScroll,
  notifications, onSaveNotifications, hapticFeedback, onSaveHapticFeedback, temperature, onSaveTemperature, contextLimit, onSaveContextLimit, maxOutputTokens, onSaveMaxOutputTokens,
  topP, onSaveTopP, frequencyPenalty, onSaveFrequencyPenalty, presencePenalty, onSavePresencePenalty, safetyLevel, onSaveSafetyLevel, username, onSaveUsername, userAvatar, onSaveUserAvatar,
  incognitoMode, onSaveIncognitoMode, soundEnabled, onSaveSoundEnabled, showLatency, onSaveShowLatency, onResetData, onExportChat,
  uiDensity, onSaveUiDensity, messageAlignment, onSaveMessageAlignment, backgroundStyle, onSaveBackgroundStyle, glassEffect, onSaveGlassEffect, blurOnLeave, onSaveBlurOnLeave,
  voiceSpeed, onSaveVoiceSpeed, autoRead, onSaveAutoRead, showTokenCount, onSaveShowTokenCount, debugMode, onSaveDebugMode, startPage, onSaveStartPage, spellcheck, onSaveSpellcheck,
  streamResponse, onSaveStreamResponse, showTimestamp, onSaveShowTimestamp, highContrast, onSaveHighContrast, exportFormat, onSaveExportFormat,
  sidebarMode, onSaveSidebarMode, fontWeight, onSaveFontWeight, notificationSound, onSaveNotificationSound, responseStyle, onSaveResponseStyle, autoTitle, onSaveAutoTitle, renderLatex, onSaveRenderLatex, autoDelete, onSaveAutoDelete
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'intelligence' | 'appearance' | 'sound' | 'system' | 'advanced' | 'laboratory' | 'shortcuts' | 'support' | 'about'>('general');
  const [localUsername, setLocalUsername] = useState(username);
  const [personaText, setPersonaText] = useState(currentPersona);
  const [isEmailCopied, setIsEmailCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      setLocalUsername(username);
      setPersonaText(currentPersona);
    }
  }, [isOpen, username, currentPersona]);

  const handleSaveAll = () => {
    onSaveUsername(localUsername);
    onSavePersona(personaText);
    onClose();
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onSaveUserAvatar) return;
    if (file.size > 1024 * 1024) {
      window.alert("Max 1MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => onSaveUserAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("tdacompanytr@gmail.com");
    setIsEmailCopied(true);
    setTimeout(() => setIsEmailCopied(false), 2000);
  };

  const theme = THEMES[currentColor] || THEMES.red;

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-shrink-0 flex items-center justify-center gap-2 px-5 py-3 text-xs md:text-sm font-bold uppercase tracking-wide border-b-2 transition-all duration-200 whitespace-nowrap ${
        activeTab === id 
          ? `${theme.text} ${theme.border} bg-gray-900/50` 
          : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-900/30'
      }`}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );

  const ToggleItem = ({ label, desc, checked, onChange, icon: Icon }: any) => (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900/30 hover:bg-gray-900/60 border border-gray-800/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-gray-800 text-gray-400`}><Icon size={18} /></div>
        <div><div className="text-sm font-medium text-gray-200">{label}</div><div className="text-[10px] text-gray-500">{desc}</div></div>
      </div>
      <button onClick={() => onChange(!checked)} className={`w-10 h-6 rounded-full transition-colors relative ${checked ? theme.primary : 'bg-gray-700'}`}>
        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
      </button>
    </div>
  );

  const SelectItem = ({ label, value, options, onChange, icon: Icon }: any) => (
    <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-800/50">
       <div className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-400 uppercase"><Icon size={14} /> {label}</div>
       <div className="flex bg-gray-900/80 rounded-lg p-1 border border-gray-800 overflow-x-auto custom-scrollbar">
          {options.map((opt: any) => (
             <button key={opt.value} onClick={() => onChange(opt.value)} className={`flex-1 min-w-[60px] py-1.5 px-2 rounded text-[10px] md:text-xs font-bold transition-all whitespace-nowrap ${value === opt.value ? theme.primary + ' text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
                {opt.label}
             </button>
          ))}
       </div>
    </div>
  );

  const ShortcutItem = ({ label, keys }: any) => (
    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-900/30 border border-gray-800/50 hover:bg-gray-900/60 transition-colors">
      <span className="text-sm font-medium text-gray-300">{label}</span>
      <div className="flex gap-1.5">
        {keys.map((k: string, i: number) => (
          <kbd key={i} className="px-2.5 py-1 rounded bg-gray-800 border border-gray-700 text-xs font-mono text-gray-400 shadow-sm min-w-[24px] text-center">{k}</kbd>
        ))}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in">
      <div className="bg-gray-950 w-full max-w-6xl h-[95vh] md:h-[90vh] rounded-2xl border border-gray-800 shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        
        <div className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${theme.iconBg} ${theme.text}`}><Settings size={20} /></div>
            <div><h2 className="text-lg font-bold text-white leading-none">Kontrol Merkezi Ultimate</h2><p className="text-xs text-gray-500 mt-1">Sistem Geneli Yapılandırma Paneli</p></div>
          </div>
          <button onClick={() => onClose()} className="text-gray-400 hover:text-white p-2 hover:bg-gray-900 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <div className="flex border-b border-gray-800 shrink-0 bg-gray-950 overflow-x-auto custom-scrollbar">
          <TabButton id="general" label="Genel" icon={Sliders} />
          <TabButton id="intelligence" label="Zeka" icon={Cpu} />
          <TabButton id="appearance" label="Görünüm" icon={Palette} />
          <TabButton id="sound" label="Ses" icon={Speaker} />
          <TabButton id="system" label="Sistem" icon={Monitor} />
          <TabButton id="shortcuts" label="Kısayollar" icon={Keyboard} />
          <TabButton id="advanced" label="Gelişmiş" icon={Terminal} />
          <TabButton id="laboratory" label="Laboratuvar" icon={Beaker} />
          <TabButton id="support" label="Destek" icon={LifeBuoy} />
          <TabButton id="about" label="Hakkında" icon={Info} />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-black/20">
          
          {/* GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
              <section className="bg-gray-900/20 p-5 rounded-2xl border border-gray-800">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><UserCircle size={16} /> Kimlik & Profil</h3>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                   <div className="flex flex-col items-center gap-3">
                      <div className="relative group">
                         <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-700 overflow-hidden flex items-center justify-center shadow-xl">
                            {userAvatar ? (
                                <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <UserCircle size={48} className="text-gray-500" />
                            )}
                         </div>
                         <button onClick={() => fileInputRef.current?.click()} className={`absolute bottom-0 right-0 p-2 rounded-full text-white shadow-lg hover:scale-110 active:scale-95 ${theme.primary} transition-all`} title="Fotoğraf Yükle"><Camera size={16} /></button>
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                      </div>
                      {userAvatar && (
                          <button onClick={() => onSaveUserAvatar && onSaveUserAvatar(null)} className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1 px-2 py-1 hover:bg-red-900/20 rounded"><Trash2 size={12} /> Kaldır</button>
                      )}
                   </div>
                   
                   <div className="flex-1 w-full space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Kullanıcı Adı</label>
                              <input type="text" value={localUsername} onChange={(e) => setLocalUsername(e.target.value)} className={`w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-${currentColor}-500 transition-colors`} placeholder="Adınız" />
                          </div>
                          <div>
                             <label className="block text-sm font-medium text-gray-300 mb-2">Hazır Avatarlar</label>
                             <div className="flex gap-2 flex-wrap">
                                {PRESET_AVATARS.map((avatar, index) => (
                                    <button key={index} onClick={() => onSaveUserAvatar && onSaveUserAvatar(avatar)} className={`w-10 h-10 rounded-full bg-gray-900 border ${userAvatar === avatar ? `border-${currentColor}-500` : 'border-gray-800'} hover:border-gray-500 flex items-center justify-center p-2 transition-all hover:scale-110`}>
                                        <img src={avatar} alt={`Preset ${index}`} className="w-full h-full" />
                                    </button>
                                ))}
                             </div>
                          </div>
                      </div>
                      <div><label className="block text-sm font-medium text-gray-300 mb-2">Gizli Mod</label><button onClick={() => onSaveIncognitoMode(!incognitoMode)} className={`w-full py-2.5 rounded-xl font-bold transition-all border flex items-center justify-center gap-2 ${incognitoMode ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-gray-900 border-gray-800 text-gray-400'}`}>{incognitoMode ? <><EyeOff size={16}/> Aktif (Kayıt Tutulmaz)</> : <><Eye size={16}/> Pasif (Geçmiş Kaydedilir)</>}</button></div>
                   </div>
                </div>
              </section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ToggleItem label="Enter ile Gönder" desc="Shift+Enter satır atlar" checked={enterToSend} onChange={onSaveEnterToSend} icon={Keyboard} />
                <ToggleItem label="Masaüstü Bildirimleri" desc="Arka plandayken uyar" checked={notifications} onChange={onSaveNotifications} icon={Bell} />
                <ToggleItem label="Titreşim (Haptic)" desc="Mobilde dokunma hissi" checked={hapticFeedback} onChange={onSaveHapticFeedback} icon={Fingerprint} />
                <ToggleItem label="Gizlilik Kalkanı" desc="Pencereden çıkınca bulanıklaştır" checked={blurOnLeave} onChange={onSaveBlurOnLeave} icon={Shield} />
              </div>
            </div>
          )}

          {/* INTELLIGENCE */}
          {activeTab === 'intelligence' && (
            <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
              <section><div className="flex justify-between items-center mb-2"><label className="text-sm font-bold text-gray-300 flex items-center gap-2"><UserCircle size={16} /> Sistem Talimatı</label></div><textarea className="w-full h-32 bg-gray-950 border border-gray-800 rounded-xl p-4 text-sm text-gray-200 resize-none" value={personaText} onChange={(e) => setPersonaText(e.target.value)} /></section>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Basic AI Config */}
                 <div className="space-y-6 bg-gray-900/20 p-5 rounded-2xl border border-gray-800">
                    <div><div className="flex justify-between mb-2"><label className="text-xs font-bold text-gray-400">YARATICILIK</label><span className={`text-xs font-bold px-2 py-0.5 rounded bg-gray-900 ${theme.text}`}>{temperature}</span></div><input type="range" min="0" max="1" step="0.1" value={temperature} onChange={(e) => onSaveTemperature(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer" /></div>
                    <div><div className="flex justify-between mb-2"><label className="text-xs font-bold text-gray-400">MAX TOKENS</label><span className={`text-xs font-bold px-2 py-0.5 rounded bg-gray-900 ${theme.text}`}>{maxOutputTokens}</span></div><input type="range" min="100" max="8192" step="100" value={maxOutputTokens} onChange={(e) => onSaveMaxOutputTokens(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer" /></div>
                 </div>
                 
                 {/* Advanced AI Config */}
                 <div className="space-y-6 bg-gray-900/20 p-5 rounded-2xl border border-gray-800">
                    <h4 className="text-xs font-bold text-gray-300 uppercase flex items-center gap-2 border-b border-gray-700 pb-2 mb-4"><Sliders size={14} /> Gelişmiş AI Yapılandırması</h4>
                    
                    {/* Top P */}
                    <div>
                      <div className="flex justify-between mb-2">
                         <div className="flex flex-col">
                           <label className="text-[10px] font-bold text-gray-400">TOP P (NÜKLEUS)</label>
                           <span className="text-[9px] text-gray-500">Olasılık kütlesi & çeşitlilik.</span>
                         </div>
                         <span className={`text-xs font-bold px-2 py-0.5 rounded bg-gray-900 ${theme.text}`}>{topP}</span>
                      </div>
                      <input type="range" min="0" max="1" step="0.05" value={topP} onChange={(e) => onSaveTopP(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    {/* Frequency Penalty */}
                    <div>
                      <div className="flex justify-between mb-2">
                         <div className="flex flex-col">
                           <label className="text-[10px] font-bold text-gray-400">FREKANS CEZASI</label>
                           <span className="text-[9px] text-gray-500">Kelime tekrarını engeller.</span>
                         </div>
                         <span className={`text-xs font-bold px-2 py-0.5 rounded bg-gray-900 ${theme.text}`}>{frequencyPenalty}</span>
                      </div>
                      <input type="range" min="0" max="2" step="0.1" value={frequencyPenalty} onChange={(e) => onSaveFrequencyPenalty(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    {/* Presence Penalty */}
                    <div>
                      <div className="flex justify-between mb-2">
                         <div className="flex flex-col">
                           <label className="text-[10px] font-bold text-gray-400">VARLIK CEZASI</label>
                           <span className="text-[9px] text-gray-500">Konu çeşitliliğini artırır.</span>
                         </div>
                         <span className={`text-xs font-bold px-2 py-0.5 rounded bg-gray-900 ${theme.text}`}>{presencePenalty}</span>
                      </div>
                      <input type="range" min="0" max="2" step="0.1" value={presencePenalty} onChange={(e) => onSavePresencePenalty(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
                    </div>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <SelectItem label="Güvenlik" value={safetyLevel} onChange={onSaveSafetyLevel} icon={ShieldAlert} options={[{label: 'Yok', value: 'none'}, {label: 'Düşük', value: 'low'}, {label: 'Yüksek', value: 'high'}]} />
                   <SelectItem label="Cevap Tarzı" value={responseStyle} onChange={onSaveResponseStyle} icon={MessageSquare} options={[{label: 'Kısa', value: 'concise'}, {label: 'Normal', value: 'normal'}, {label: 'Detaylı', value: 'verbose'}]} />
                   <ToggleItem label="Akış (Stream)" desc="Parça parça yanıt" checked={streamResponse} onChange={onSaveStreamResponse} icon={Zap} />
               </div>
            </div>
          )}

          {/* APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
               <section>
                  <label className="block text-sm font-bold text-gray-400 uppercase mb-3">Tema Rengi</label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 p-2">
                    {Object.keys(THEMES).map((k) => (
                      <button 
                        key={k} 
                        onClick={() => onSaveColor(k)} 
                        className={`aspect-square w-full rounded-2xl flex items-center justify-center border-2 transition-all duration-200 ${currentColor === k ? 'border-white scale-105 shadow-xl shadow-black/50' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'} ${THEMES[k].primary}`}
                        title={THEMES[k].name}
                      >
                        {currentColor === k && <Check size={20} className="text-white drop-shadow-md" />}
                      </button>
                    ))}
                  </div>
               </section>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <SelectItem label="Arka Plan" value={backgroundStyle} onChange={onSaveBackgroundStyle} icon={Box} options={[{label: 'Solid', value: 'solid'}, {label: 'Gradient', value: 'gradient'}, {label: 'Parçacık', value: 'particles'}]} />
                   <SelectItem label="Yoğunluk" value={uiDensity} onChange={onSaveUiDensity} icon={Layout} options={[{label: 'Kompakt', value: 'compact'}, {label: 'Rahat', value: 'comfortable'}]} />
                   <SelectItem label="Hizalama" value={messageAlignment} onChange={onSaveMessageAlignment} icon={Layout} options={[{label: 'Modern', value: 'modern'}, {label: 'Klasik', value: 'classic'}]} />
                   <SelectItem label="Kenar Çubuğu" value={sidebarMode} onChange={onSaveSidebarMode} icon={Sidebar} options={[{label: 'İtme', value: 'push'}, {label: 'Overlay', value: 'overlay'}]} />
                   <SelectItem label="Kalınlık" value={fontWeight} onChange={onSaveFontWeight} icon={Type} options={[{label: 'İnce', value: 'light'}, {label: 'Normal', value: 'normal'}, {label: 'Orta', value: 'medium'}, {label: 'Kalın', value: 'bold'}]} />
               </div>
               <div className="bg-gray-900/30 p-5 rounded-xl border border-gray-800">
                 <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-4"><Type size={16} /> Yazı Tipi</label>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                   {fontOptions.map((font) => (<button key={font.id} onClick={() => onSaveFontFamily && onSaveFontFamily(font.id)} className={`p-3 rounded-xl border text-left transition-all ${fontFamily === font.id ? `${theme.border} ${theme.iconBg}` : 'border-gray-800 bg-gray-900/50'}`}><div className={`text-lg mb-1 ${font.id}`}>Ag</div><div className="text-xs font-bold text-gray-300 truncate">{font.name}</div></button>))}
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ToggleItem label="Avatarlar" desc="Mesaj ikonları" checked={showAvatars} onChange={onSaveShowAvatars} icon={UserCircle} />
                  <ToggleItem label="Daktilo Efekti" desc="Yazı animasyonu" checked={typingEffect} onChange={onSaveTypingEffect} icon={Zap} />
                  <ToggleItem label="Satır No" desc="Kod bloklarında" checked={showLineNumbers} onChange={onSaveShowLineNumbers} icon={Hash} />
                  <ToggleItem label="Cam Efekti" desc="Blur UI" checked={glassEffect} onChange={onSaveGlassEffect} icon={Layers} />
                  <ToggleItem label="Yüksek Karşıtlık" desc="Erişilebilirlik" checked={highContrast} onChange={onSaveHighContrast} icon={Sun} />
               </div>
            </div>
          )}

          {/* SOUND */}
          {activeTab === 'sound' && (
             <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
                <section className="bg-gray-900/20 p-6 rounded-2xl border border-gray-800">
                   <h3 className="text-lg font-bold text-white mb-6 flex gap-2"><Speaker size={24}/> Ses Motoru</h3>
                   <div className="space-y-6">
                      <ToggleItem label="Efekt Sesleri" desc="UI sesleri" checked={soundEnabled} onChange={onSaveSoundEnabled} icon={Music} />
                      <ToggleItem label="Otomatik Okuma" desc="TTS" checked={autoRead} onChange={onSaveAutoRead} icon={Mic2} />
                      <SelectItem label="Bildirim Sesi" value={notificationSound} onChange={onSaveNotificationSound} icon={Bell} options={[{label: 'Varsayılan', value: 'default'}, {label: 'Hafif', value: 'subtle'}, {label: 'Eğlenceli', value: 'funky'}]} />
                      <div><div className="flex justify-between mb-2"><label className="text-xs font-bold text-gray-400">HIZ</label><span className={`text-xs font-bold px-2 py-0.5 rounded bg-gray-900 ${theme.text}`}>{voiceSpeed}x</span></div><input type="range" min="0.5" max="2" step="0.1" value={voiceSpeed} onChange={(e) => onSaveVoiceSpeed(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer" /></div>
                   </div>
                </section>
             </div>
          )}

          {/* SYSTEM */}
          {activeTab === 'system' && (
             <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <SelectItem label="Başlangıç" value={startPage} onChange={onSaveStartPage} icon={Layout} options={[{label: 'Sohbet', value: 'chat'}, {label: 'Yeni', value: 'new'}, {label: 'Geçmiş', value: 'history'}]} />
                   <SelectItem label="Saat" value={timeFormat} onChange={onSaveTimeFormat} icon={Clock} options={[{label: '12h', value: '12h'}, {label: '24h', value: '24h'}]} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ToggleItem label="Oto-Kaydırma" desc="Smart scroll" checked={autoScroll} onChange={onSaveAutoScroll} icon={ArrowDownCircle} />
                    <ToggleItem label="Yazım Denetimi" desc="Spellcheck" checked={spellcheck} onChange={onSaveSpellcheck} icon={Type} />
                    <ToggleItem label="Oto-Başlık" desc="Sohbet başlıkları" checked={autoTitle} onChange={onSaveAutoTitle} icon={Type} />
                </div>
             </div>
          )}

          {/* SHORTCUTS */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-8 max-w-3xl mx-auto animate-fade-in">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 px-1">Genel Navigasyon</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   <ShortcutItem label="Yeni Sohbet" keys={['Ctrl', 'K']} />
                   <ShortcutItem label="Yan Menü" keys={['Ctrl', 'B']} />
                   <ShortcutItem label="Ayarlar" keys={['Ctrl', '/']} />
                   <ShortcutItem label="Odak Modu" keys={['Ctrl', 'F']} />
                   <ShortcutItem label="Hızlı Menü" keys={['Ctrl', 'H']} />
                   <ShortcutItem label="Tümünü Kapat" keys={['Esc']} />
                </div>
              </div>
              
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 px-1">Sohbet Eylemleri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   <ShortcutItem label="Mesajı Gönder" keys={['Enter']} />
                   <ShortcutItem label="Alt Satır" keys={['Shift', 'Enter']} />
                   <ShortcutItem label="Sohbeti Temizle" keys={['Ctrl', 'L']} />
                   <ShortcutItem label="Yedekle (Export)" keys={['Ctrl', 'S']} />
                   <ShortcutItem label="Mikrofon" keys={['Ctrl', 'M']} />
                   <ShortcutItem label="Yeniden Üret" keys={['Ctrl', 'R']} />
                   <ShortcutItem label="En Alta Git" keys={['Ctrl', 'J']} />
                </div>
              </div>
            </div>
          )}

          {/* ADVANCED */}
          {activeTab === 'advanced' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <SelectItem label="Format" value={exportFormat} onChange={onSaveExportFormat} icon={FileText} options={[{label: 'JSON', value: 'json'}, {label: 'TXT', value: 'txt'}, {label: 'MD', value: 'md'}]} />
                   <ToggleItem label="Ping" desc="Gecikme süresi" checked={showLatency} onChange={onSaveShowLatency} icon={Activity} />
                   <ToggleItem label="Token Sayacı" desc="Kullanım" checked={showTokenCount} onChange={onSaveShowTokenCount} icon={Hash} />
                   <ToggleItem label="Debug" desc="Geliştirici" checked={debugMode} onChange={onSaveDebugMode} icon={Terminal} />
               </div>
               <div className="p-8 mt-8 rounded-2xl bg-gradient-to-b from-red-950/20 to-transparent border border-red-900/30 text-center">
                  <ShieldAlert size={32} className="text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-6">Tehlikeli Bölge</h3>
                  <div className="flex justify-center gap-4">
                      <button onClick={() => onExportChat()} className="px-6 py-3 rounded-xl bg-gray-900 border border-gray-700 flex gap-2 items-center"><Download size={18} /> Yedekle</button>
                      <button onClick={() => { if (window.confirm("Sil?")) { onResetData(); onClose(); } }} className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl flex gap-2 items-center font-bold text-white"><Trash2 size={18} /> Sıfırla</button>
                  </div>
               </div>
            </div>
          )}

          {/* LABORATORY */}
          {activeTab === 'laboratory' && (
             <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
                <div className="bg-purple-900/20 border border-purple-500/30 p-6 rounded-2xl mb-6">
                   <h3 className="text-lg font-bold text-purple-200 mb-2 flex items-center gap-2"><Beaker size={20}/> Deneysel Özellikler</h3>
                   <p className="text-xs text-purple-300/70">Bu özellikler geliştirme aşamasındadır ve kararsız olabilir.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <ToggleItem label="LaTeX Render" desc="Matematik formülleri" checked={renderLatex} onChange={onSaveRenderLatex} icon={Sigma} />
                   <ToggleItem label="Otomatik Silme" desc="24s sonra geçmişi sil" checked={autoDelete} onChange={onSaveAutoDelete} icon={Trash2} />
                </div>
             </div>
          )}

          {/* SUPPORT */}
          {activeTab === 'support' && (
            <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
              <div className="bg-gray-900/20 p-8 rounded-2xl border border-gray-800 text-center">
                 <h3 className="text-2xl font-bold text-white mb-2">Yardıma mı ihtiyacın var?</h3>
                 <p className="text-gray-400 mb-8">Her türlü soru, öneri ve hata bildirimi için bizimle iletişime geçebilirsin.</p>

                 <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 inline-flex flex-col items-center gap-4 shadow-lg relative group">
                    <div className={`p-4 rounded-full ${theme.iconBg} ${theme.text}`}>
                      <Mail size={32} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">E-posta Destek Hattı</div>
                      <a href="mailto:tdacompanytr@gmail.com" className="text-xl font-mono text-white hover:text-red-400 transition-colors block">
                        tdacompanytr@gmail.com
                      </a>
                    </div>
                    <button 
                      onClick={handleCopyEmail} 
                      className={`absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all ${isEmailCopied ? 'text-green-500' : ''}`}
                      title="Kopyala"
                    >
                      {isEmailCopied ? <Check size={16}/> : <Copy size={16}/>}
                    </button>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-gray-900/30 p-5 rounded-xl border border-gray-800/50">
                    <h4 className="font-bold text-white mb-2">Hata mı buldun?</h4>
                    <p className="text-sm text-gray-400">Karşılaştığın teknik sorunları ekran görüntüsü ile birlikte mail atarsan en kısa sürede çözeriz.</p>
                 </div>
                 <div className="bg-gray-900/30 p-5 rounded-xl border border-gray-800/50">
                    <h4 className="font-bold text-white mb-2">Önerin mi var?</h4>
                    <p className="text-sm text-gray-400">Uygulamaya eklenmesini istediğin özellikleri bize yazmaktan çekinme. Td AI seninle gelişiyor.</p>
                 </div>
              </div>
            </div>
          )}

          {/* ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-8 max-w-3xl mx-auto animate-fade-in">
               <div className="text-center py-8">
                  <div className={`w-24 h-24 mx-auto rounded-3xl ${theme.primary} flex items-center justify-center shadow-2xl shadow-red-900/50 mb-6`}>
                     <Sparkles size={48} className="text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-2">Td AI</h1>
                  <div className="flex items-center justify-center gap-2">
                     <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase bg-gray-900 border border-gray-800 text-gray-400`}>v5.2 (Ultimate)</span>
                  </div>
               </div>

               <div className="bg-gray-900/30 rounded-2xl border border-gray-800 overflow-hidden">
                  <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex items-center gap-2 font-bold text-gray-300 uppercase text-xs tracking-wider">
                     <Cpu size={14} className={theme.text} /> Yapay Zeka Motoru
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                        <div className="text-sm text-gray-500 mb-1">Model</div>
                        <div className="text-lg font-bold text-white">Gemini 2.5 Flash</div>
                     </div>
                     <div>
                        <div className="text-sm text-gray-500 mb-1">Sağlayıcı</div>
                        <div className="text-lg font-bold text-white flex items-center gap-2">Google DeepMind</div>
                     </div>
                     <div>
                        <div className="text-sm text-gray-500 mb-1">Bağlam Penceresi</div>
                        <div className="text-lg font-bold text-white">1M Token</div>
                     </div>
                     <div>
                        <div className="text-sm text-gray-500 mb-1">Yetenekler</div>
                        <div className="text-sm font-medium text-gray-300 leading-relaxed">
                            Gelişmiş Metin Üretimi, Kod Yazma ve Hata Ayıklama, Matematiksel Problem Çözme, Yüksek Kaliteli Resim Çizme (Imagen 3), Görsel Analiz (Multimodal), Sesli ve Görüntülü Etkileşim, Belge ve Veri Analizi.
                        </div>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="bg-gray-900/30 rounded-2xl border border-gray-800 p-5">
                      <div className="flex items-center gap-2 font-bold text-gray-300 uppercase text-xs tracking-wider mb-3">
                        <Code size={14} /> Geliştirici
                      </div>
                      <div className="font-bold text-white">Tda Company</div>
                   </div>
                   <div className="bg-gray-900/30 rounded-2xl border border-gray-800 p-5">
                      <div className="flex items-center gap-2 font-bold text-gray-300 uppercase text-xs tracking-wider mb-3">
                        <Globe size={14} /> Web Sitesi
                      </div>
                      <a href="https://link.bilfen.com/TdaCompany" target="_blank" rel="noopener noreferrer" className="font-bold text-blue-400 hover:underline">link.bilfen.com/TdaCompany</a>
                   </div>
               </div>

               <div className="text-center text-xs text-gray-600 pt-8 border-t border-gray-800/50">
                  &copy; {new Date().getFullYear()} Tda Company. Tüm hakları saklıdır.
               </div>
            </div>
          )}

        </div>
        
        <div className="p-4 border-t border-gray-800 bg-gray-900/50 shrink-0 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-gray-400 hover:bg-gray-800 transition-colors">İptal</button>
            <button onClick={handleSaveAll} className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95 ${theme.primary} ${theme.primaryHover}`}>Kaydet ve Çık</button>
        </div>

      </div>
    </div>
  );
};
