import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Type, Keyboard, Zap, Monitor, Sliders, Volume2, Trash2, Info, ShieldAlert, Layout, Maximize, Minimize, Cpu, ArrowDownCircle, UserCircle, Bell, Clock, Activity, Download, Settings, DownloadCloud, Lock, Eye, EyeOff, Hash, MousePointerClick, Globe, Sparkles, Fingerprint, Circle, Mic2, Speaker, Music, Layers, Palette, Box, Shield, Terminal, Command, Camera } from 'lucide-react';
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

  // --- MEGA NEW PROPS ---
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

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, currentPersona, onSavePersona, currentColor, onSaveColor, fontSize, onSaveFontSize, fontFamily = 'font-sans', onSaveFontFamily = () => {},
  showAvatars, onSaveShowAvatars, timeFormat, onSaveTimeFormat, borderRadius, onSaveBorderRadius, animationSpeed, onSaveAnimationSpeed, showLineNumbers, onSaveShowLineNumbers,
  chatWidth, onSaveChatWidth, sidebarPosition, onSaveSidebarPosition, enterToSend, onSaveEnterToSend, typingEffect, onSaveTypingEffect, autoScroll, onSaveAutoScroll,
  notifications, onSaveNotifications, hapticFeedback, onSaveHapticFeedback, temperature, onSaveTemperature, contextLimit, onSaveContextLimit, maxOutputTokens, onSaveMaxOutputTokens,
  topP, onSaveTopP, frequencyPenalty, onSaveFrequencyPenalty, presencePenalty, onSavePresencePenalty, safetyLevel, onSaveSafetyLevel, username, onSaveUsername, userAvatar, onSaveUserAvatar,
  incognitoMode, onSaveIncognitoMode, soundEnabled, onSaveSoundEnabled, showLatency, onSaveShowLatency, onResetData, onExportChat,
  // Mega New Props
  uiDensity, onSaveUiDensity, messageAlignment, onSaveMessageAlignment, backgroundStyle, onSaveBackgroundStyle, glassEffect, onSaveGlassEffect, blurOnLeave, onSaveBlurOnLeave,
  voiceSpeed, onSaveVoiceSpeed, autoRead, onSaveAutoRead, showTokenCount, onSaveShowTokenCount, debugMode, onSaveDebugMode, startPage, onSaveStartPage, spellcheck, onSaveSpellcheck
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'intelligence' | 'appearance' | 'sound' | 'system' | 'advanced'>('general');
  const [localUsername, setLocalUsername] = useState(username);
  const [personaText, setPersonaText] = useState(currentPersona);
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

    if (file.size > 1024 * 1024) { // 1MB Limit
       alert("Profil resmi 1MB'dan küçük olmalıdır.");
       return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
       onSaveUserAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
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
        <div className={`p-2 rounded-lg bg-gray-800 text-gray-400`}>
          <Icon size={18} />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-200">{label}</div>
          <div className="text-[10px] text-gray-500">{desc}</div>
        </div>
      </div>
      <button 
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors relative ${checked ? theme.primary : 'bg-gray-700'}`}
      >
        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
      </button>
    </div>
  );

  const SelectItem = ({ label, value, options, onChange, icon: Icon }: any) => (
    <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-800/50">
       <div className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-400 uppercase">
          <Icon size={14} /> {label}
       </div>
       <div className="flex bg-gray-900/80 rounded-lg p-1 border border-gray-800">
          {options.map((opt: any) => (
             <button key={opt.value} onClick={() => onChange(opt.value)} className={`flex-1 py-1.5 rounded text-[10px] md:text-xs font-bold transition-all ${value === opt.value ? theme.primary + ' text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
                {opt.label}
             </button>
          ))}
       </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in">
      <div className="bg-gray-950 w-full max-w-6xl h-[95vh] md:h-[90vh] rounded-2xl border border-gray-800 shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${theme.iconBg} ${theme.text}`}>
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none">Kontrol Merkezi Ultimate</h2>
              <p className="text-xs text-gray-500 mt-1">Sistem Geneli Yapılandırma Paneli</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-gray-900 rounded-full transition-colors active:scale-90">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 shrink-0 bg-gray-950 overflow-x-auto custom-scrollbar">
          <TabButton id="general" label="Genel" icon={Sliders} />
          <TabButton id="intelligence" label="Zeka" icon={Cpu} />
          <TabButton id="appearance" label="Görünüm" icon={Palette} />
          <TabButton id="sound" label="Ses" icon={Speaker} />
          <TabButton id="system" label="Sistem" icon={Monitor} />
          <TabButton id="advanced" label="Gelişmiş" icon={Terminal} />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-black/20">
          
          {/* --- GENERAL TAB --- */}
          {activeTab === 'general' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
              
              <section className="bg-gray-900/20 p-5 rounded-2xl border border-gray-800">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                  <UserCircle size={16} /> Kimlik & Profil
                </h3>
                <div className="flex flex-col md:flex-row gap-6">
                   <div className="flex flex-col items-center gap-3">
                      <div className="relative group">
                         <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-gray-700 overflow-hidden flex items-center justify-center">
                            {userAvatar ? (
                               // eslint-disable-next-line @next/next/no-img-element
                               <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                               <UserCircle size={40} className="text-gray-500" />
                            )}
                         </div>
                         <button onClick={() => fileInputRef.current?.click()} className={`absolute bottom-0 right-0 p-1.5 rounded-full text-white shadow-lg transition-transform hover:scale-110 active:scale-95 ${theme.primary}`}>
                            <Camera size={14} />
                         </button>
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                      </div>
                      <button onClick={() => onSaveUserAvatar && onSaveUserAvatar(null)} className="text-[10px] text-red-400 hover:underline">Resmi Kaldır</button>
                   </div>
                   
                   <div className="flex-1 grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Kullanıcı Adı</label>
                        <input 
                          type="text" 
                          value={localUsername}
                          onChange={(e) => setLocalUsername(e.target.value)}
                          className={`w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-${currentColor}-500 transition-colors`}
                          placeholder="Sohbette görünecek isminiz"
                        />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-300 mb-2">Gizli Mod</label>
                         <button onClick={() => onSaveIncognitoMode(!incognitoMode)} className={`w-full py-2.5 rounded-xl font-bold transition-all border flex items-center justify-center gap-2 ${incognitoMode ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-gray-900 border-gray-800 text-gray-400'}`}>
                            {incognitoMode ? <><EyeOff size={16}/> Aktif (Kayıt Yok)</> : <><Eye size={16}/> Pasif (Kaydediliyor)</>}
                         </button>
                      </div>
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

          {/* --- INTELLIGENCE TAB --- */}
          {activeTab === 'intelligence' && (
            <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
              <section>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                    <UserCircle size={16} className={theme.text} /> Sistem Talimatı (Persona)
                  </label>
                  <span className="text-[10px] text-gray-500">Modelin karakterini belirler</span>
                </div>
                <textarea
                  className="w-full h-32 bg-gray-950 border border-gray-800 rounded-xl p-4 text-sm text-gray-200 focus:ring-1 focus:ring-gray-600 resize-none custom-scrollbar leading-relaxed"
                  value={personaText}
                  onChange={(e) => setPersonaText(e.target.value)}
                  placeholder="Örn: Sen deneyimli bir yazılım mühendisisin..."
                />
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-6 bg-gray-900/20 p-5 rounded-2xl border border-gray-800">
                    <div>
                       <div className="flex justify-between mb-2"><label className="text-xs font-bold text-gray-400 uppercase">Yaratıcılık</label><span className={`text-xs font-bold px-2 py-0.5 rounded bg-gray-900 ${theme.text}`}>{temperature}</span></div>
                       <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={(e) => onSaveTemperature(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer" style={{ accentColor: THEMES[currentColor].primary.replace('bg-','') }} />
                    </div>
                    <div>
                       <div className="flex justify-between mb-2"><label className="text-xs font-bold text-gray-400 uppercase">Maksimum Uzunluk</label><span className={`text-xs font-bold px-2 py-0.5 rounded bg-gray-900 ${theme.text}`}>{maxOutputTokens}</span></div>
                       <input type="range" min="100" max="8192" step="100" value={maxOutputTokens} onChange={(e) => onSaveMaxOutputTokens(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer" style={{ accentColor: THEMES[currentColor].primary.replace('bg-','') }} />
                    </div>
                 </div>

                 <div className="space-y-6 bg-gray-900/20 p-5 rounded-2xl border border-gray-800">
                    <div>
                       <div className="flex justify-between mb-2"><label className="text-xs font-bold text-gray-400 uppercase">Tekrar Cezası</label><span className={`text-xs font-bold px-2 py-0.5 rounded bg-gray-900 ${theme.text}`}>{frequencyPenalty}</span></div>
                       <input type="range" min="0" max="2" step="0.1" value={frequencyPenalty} onChange={(e) => onSaveFrequencyPenalty(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer" style={{ accentColor: THEMES[currentColor].primary.replace('bg-','') }} />
                    </div>
                    <div>
                       <div className="flex justify-between mb-2"><label className="text-xs font-bold text-gray-400 uppercase">Konu Cezası</label><span className={`text-xs font-bold px-2 py-0.5 rounded bg-gray-900 ${theme.text}`}>{presencePenalty}</span></div>
                       <input type="range" min="0" max="2" step="0.1" value={presencePenalty} onChange={(e) => onSavePresencePenalty(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer" style={{ accentColor: THEMES[currentColor].primary.replace('bg-','') }} />
                    </div>
                 </div>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <SelectItem label="Güvenlik Filtresi" value={safetyLevel} onChange={onSaveSafetyLevel} icon={ShieldAlert} options={[
                       {label: 'Yok (Riskli)', value: 'none'}, {label: 'Düşük', value: 'low'}, {label: 'Yüksek', value: 'high'}
                   ]} />
                   <SelectItem label="Hafıza Derinliği" value={contextLimit} onChange={onSaveContextLimit} icon={Layers} options={[
                       {label: 'Kısa', value: 'low'}, {label: 'Normal', value: 'medium'}, {label: 'Uzun (Yavaş)', value: 'high'}
                   ]} />
               </div>
            </div>
          )}

          {/* --- APPEARANCE TAB --- */}
          {activeTab === 'appearance' && (
            <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
               <section>
                  <label className="block text-sm font-bold text-gray-400 uppercase mb-3">Tema Rengi</label>
                  <div className="flex items-center gap-4 overflow-x-auto pb-2 custom-scrollbar">
                    {Object.keys(THEMES).map((colorKey) => (
                      <button key={colorKey} onClick={() => onSaveColor(colorKey)} className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center transition-all border-2 ${currentColor === colorKey ? 'border-white scale-110 shadow-xl' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'} ${THEMES[colorKey].primary}`}>
                        {currentColor === colorKey && <Check size={20} className="text-white" />}
                      </button>
                    ))}
                  </div>
               </section>

               {/* Background & Layout Config */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <SelectItem label="Arka Plan Stili" value={backgroundStyle} onChange={onSaveBackgroundStyle} icon={Box} options={[
                       {label: 'Solid', value: 'solid'}, {label: 'Gradient', value: 'gradient'}, {label: 'Parçacık', value: 'particles'}
                   ]} />
                   <SelectItem label="UI Yoğunluğu" value={uiDensity} onChange={onSaveUiDensity} icon={Layout} options={[
                       {label: 'Kompakt', value: 'compact'}, {label: 'Rahat', value: 'comfortable'}
                   ]} />
                   <SelectItem label="Hizalama" value={messageAlignment} onChange={onSaveMessageAlignment} icon={Layout} options={[
                       {label: 'Modern (Sol)', value: 'modern'}, {label: 'Klasik (Karşılıklı)', value: 'classic'}
                   ]} />
               </div>

               {/* Font Family Selection */}
               <div className="bg-gray-900/30 p-5 rounded-xl border border-gray-800">
                 <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-4"><Type size={16} /> Yazı Tipi</label>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                   {fontOptions.map((font) => (
                     <button key={font.id} onClick={() => onSaveFontFamily && onSaveFontFamily(font.id)} className={`relative p-3 rounded-xl border text-left transition-all group active:scale-95 ${fontFamily === font.id ? `${theme.border} ${theme.iconBg} shadow-md` : 'border-gray-800 bg-gray-900/50 hover:bg-gray-800'}`}>
                       <div className={`text-lg mb-1 ${font.id}`}>Ag</div>
                       <div className="text-xs font-bold text-gray-300 truncate">{font.name}</div>
                       {fontFamily === font.id && <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${theme.primary}`}></div>}
                     </button>
                   ))}
                 </div>
               </div>
               
               {/* Fine Tuning */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <SelectItem label="Köşe Yuvarlaklığı" value={borderRadius} onChange={onSaveBorderRadius} icon={Circle} options={[
                       {label: 'S', value: 'small'}, {label: 'M', value: 'medium'}, {label: 'L', value: 'large'}, {label: 'XL', value: 'full'}
                   ]} />
                   <SelectItem label="Animasyon Hızı" value={animationSpeed} onChange={onSaveAnimationSpeed} icon={Activity} options={[
                       {label: 'Yavaş', value: 'slow'}, {label: 'Normal', value: 'normal'}, {label: 'Hızlı', value: 'fast'}
                   ]} />
               </div>

               {/* Toggles */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ToggleItem label="Avatarları Göster" desc="Mesaj yanı ikonlar" checked={showAvatars} onChange={onSaveShowAvatars} icon={UserCircle} />
                  <ToggleItem label="Daktilo Efekti" desc="Yazı animasyonu" checked={typingEffect} onChange={onSaveTypingEffect} icon={Zap} />
                  <ToggleItem label="Kod Satır Numaraları" desc="Kod bloklarında göster" checked={showLineNumbers} onChange={onSaveShowLineNumbers} icon={Hash} />
                  <ToggleItem label="Cam Efekti (Blur)" desc="Arayüzde buzlu cam" checked={glassEffect} onChange={onSaveGlassEffect} icon={Layers} />
               </div>
            </div>
          )}

          {/* --- SOUND TAB (NEW) --- */}
          {activeTab === 'sound' && (
             <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
                <section className="bg-gray-900/20 p-6 rounded-2xl border border-gray-800">
                   <div className="flex items-center gap-4 mb-6">
                      <div className={`p-3 rounded-full ${theme.iconBg}`}><Speaker size={24} className={theme.text}/></div>
                      <h3 className="text-lg font-bold text-white">Ses Motoru</h3>
                   </div>
                   
                   <div className="space-y-6">
                      <ToggleItem label="Efekt Sesleri" desc="Gönderim ve uyarı sesleri" checked={soundEnabled} onChange={onSaveSoundEnabled} icon={Music} />
                      <ToggleItem label="Otomatik Okuma (TTS)" desc="Cevapları sesli oku" checked={autoRead} onChange={onSaveAutoRead} icon={Mic2} />
                      
                      <div>
                         <div className="flex justify-between mb-2"><label className="text-xs font-bold text-gray-400 uppercase">Okuma Hızı</label><span className={`text-xs font-bold px-2 py-0.5 rounded bg-gray-900 ${theme.text}`}>{voiceSpeed}x</span></div>
                         <input type="range" min="0.5" max="2" step="0.1" value={voiceSpeed} onChange={(e) => onSaveVoiceSpeed(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer" style={{ accentColor: THEMES[currentColor].primary.replace('bg-','') }} />
                      </div>
                   </div>
                </section>
             </div>
          )}

          {/* --- SYSTEM TAB (NEW) --- */}
          {activeTab === 'system' && (
             <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <SelectItem label="Başlangıç Sayfası" value={startPage} onChange={onSaveStartPage} icon={Layout} options={[
                       {label: 'Sohbet', value: 'chat'}, {label: 'Yeni Sohbet', value: 'new'}, {label: 'Geçmiş', value: 'history'}
                   ]} />
                   <SelectItem label="Saat Biçimi" value={timeFormat} onChange={onSaveTimeFormat} icon={Clock} options={[
                       {label: '12 Saat', value: '12h'}, {label: '24 Saat', value: '24h'}
                   ]} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ToggleItem label="Otomatik Kaydırma" desc="Mesaj gelince aşağı in" checked={autoScroll} onChange={onSaveAutoScroll} icon={ArrowDownCircle} />
                    <ToggleItem label="Yazım Denetimi" desc="Input alanında denetim" checked={spellcheck} onChange={onSaveSpellcheck} icon={Type} />
                </div>
             </div>
          )}

          {/* --- ADVANCED TAB --- */}
          {activeTab === 'advanced' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-fade-in flex flex-col justify-center">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <ToggleItem label="Gecikme (Ping)" desc="Süreyi göster" checked={showLatency} onChange={onSaveShowLatency} icon={Activity} />
                   <ToggleItem label="Token Sayacı" desc="Tahmini kullanım" checked={showTokenCount} onChange={onSaveShowTokenCount} icon={Hash} />
                   <ToggleItem label="Debug Modu" desc="Geliştirici verileri" checked={debugMode} onChange={onSaveDebugMode} icon={Terminal} />
               </div>
               
               <div className="p-8 mt-8 rounded-2xl bg-gradient-to-b from-red-950/20 to-transparent border border-red-900/30 text-center shadow-inner">
                  <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-red-500/50">
                    <ShieldAlert size={32} className="text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Sıfırlama Alanı</h3>
                  <div className="flex flex-col md:flex-row justify-center gap-4 mt-6">
                      <button onClick={onExportChat} className="px-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white border border-gray-700 flex items-center justify-center gap-2 transition-all">
                        <Download size={18} /> Sohbeti Yedekle
                      </button>
                      <button onClick={() => { if (window.confirm("DİKKAT: Tüm verileriniz silinecek.")) { onResetData(); onClose(); } }} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20">
                         <Trash2 size={18} /> Fabrika Ayarlarına Dön
                      </button>
                  </div>
               </div>
               
               <div className="text-center mt-8 space-y-2">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Sistem Bilgileri</p>
                  <div className="inline-flex flex-col gap-1">
                    <div className="px-3 py-1 bg-gray-900 rounded border border-gray-800 text-[10px] text-gray-400 font-mono">Td AI v4.0.0 Ultimate</div>
                    <div className="text-[10px] text-gray-600">Powered by Tda Company</div>
                  </div>
               </div>
            </div>
          )}

        </div>
        
        {/* Footer */}
        <div className="bg-gray-950 border-t border-gray-800 p-4 flex justify-end gap-3 shrink-0 z-20">
           <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-900 transition-all active:scale-95">İptal</button>
           <button onClick={handleSaveAll} className={`px-8 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${theme.primary} ${theme.primaryHover}`}>Kaydet & Kapat</button>
        </div>

      </div>
    </div>
  );
};