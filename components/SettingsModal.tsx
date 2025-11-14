import React, { useState, useEffect } from 'react';
import { X, Check, Type, Keyboard, Zap, Monitor, Sliders, Volume2, Trash2, Info, ShieldAlert, Layout, Maximize, Minimize, Cpu, ArrowDownCircle, UserCircle, Bell, Clock, Activity, Download, Settings, DownloadCloud } from 'lucide-react';
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
  
  // AI Config
  temperature: number;
  onSaveTemperature: (temp: number) => void;
  contextLimit: 'low' | 'medium' | 'high';
  onSaveContextLimit: (limit: 'low' | 'medium' | 'high') => void;
  maxOutputTokens: number;
  onSaveMaxOutputTokens: (tokens: number) => void;
  topP: number;
  onSaveTopP: (val: number) => void;
  
  // Identity
  username: string;
  onSaveUsername: (name: string) => void;

  // Sound & System
  soundEnabled: boolean;
  onSaveSoundEnabled: (enabled: boolean) => void;
  showLatency: boolean;
  onSaveShowLatency: (enabled: boolean) => void;
  
  // Actions
  onResetData: () => void;
  onExportChat: () => void;
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
  isOpen,
  onClose,
  currentPersona,
  onSavePersona,
  currentColor,
  onSaveColor,
  fontSize,
  onSaveFontSize,
  fontFamily = 'font-sans',
  onSaveFontFamily = () => {},
  showAvatars,
  onSaveShowAvatars,
  timeFormat,
  onSaveTimeFormat,
  chatWidth,
  onSaveChatWidth,
  sidebarPosition,
  onSaveSidebarPosition,
  enterToSend,
  onSaveEnterToSend,
  typingEffect,
  onSaveTypingEffect,
  autoScroll,
  onSaveAutoScroll,
  notifications,
  onSaveNotifications,
  temperature,
  onSaveTemperature,
  contextLimit,
  onSaveContextLimit,
  maxOutputTokens,
  onSaveMaxOutputTokens,
  topP,
  onSaveTopP,
  username,
  onSaveUsername,
  soundEnabled,
  onSaveSoundEnabled,
  showLatency,
  onSaveShowLatency,
  onResetData,
  onExportChat
}) => {
  // Local states
  const [activeTab, setActiveTab] = useState<'general' | 'intelligence' | 'appearance' | 'advanced'>('general');
  const [localUsername, setLocalUsername] = useState(username);
  const [personaText, setPersonaText] = useState(currentPersona);
  
  // Sync inputs when opening
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

  const theme = THEMES[currentColor] || THEMES.red;

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs md:text-sm font-bold uppercase tracking-wide border-b-2 transition-all duration-200 ${
        activeTab === id 
          ? `${theme.text} ${theme.border} bg-gray-900/50` 
          : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-900/30'
      }`}
    >
      <Icon size={16} />
      <span className="hidden md:inline">{label}</span>
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in">
      <div className="bg-gray-950 w-full max-w-4xl h-[90vh] md:h-[85vh] rounded-2xl border border-gray-800 shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${theme.iconBg} ${theme.text}`}>
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none">Kontrol Merkezi</h2>
              <p className="text-xs text-gray-500 mt-1">Uygulama ve yapay zeka ayarları</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 hover:bg-gray-900 rounded-full transition-colors active:scale-90">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 shrink-0 bg-gray-950">
          <TabButton id="general" label="Genel" icon={Sliders} />
          <TabButton id="intelligence" label="Zeka & Model" icon={Cpu} />
          <TabButton id="appearance" label="Görünüm" icon={Monitor} />
          <TabButton id="advanced" label="Gelişmiş" icon={ShieldAlert} />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-black/20">
          
          {/* --- GENERAL TAB --- */}
          {activeTab === 'general' && (
            <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
              
              {/* Identity */}
              <section className="bg-gray-900/20 p-5 rounded-2xl border border-gray-800">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                  <UserCircle size={16} /> Kimlik & Sistem
                </h3>
                <div className="space-y-4">
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
                </div>
              </section>

              {/* Toggles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ToggleItem 
                  label="Enter ile Gönder" 
                  desc="Shift+Enter satır atlar" 
                  checked={enterToSend} 
                  onChange={onSaveEnterToSend} 
                  icon={Keyboard} 
                />
                <ToggleItem 
                  label="Ses Efektleri" 
                  desc="Mesaj seslerini oynat" 
                  checked={soundEnabled} 
                  onChange={onSaveSoundEnabled} 
                  icon={Volume2} 
                />
                <ToggleItem 
                  label="Masaüstü Bildirimleri" 
                  desc="Arka plandayken uyar" 
                  checked={notifications} 
                  onChange={onSaveNotifications} 
                  icon={Bell} 
                />
                <ToggleItem 
                  label="Otomatik Kaydırma" 
                  desc="Yeni mesaj gelince aşağı in" 
                  checked={autoScroll} 
                  onChange={onSaveAutoScroll} 
                  icon={ArrowDownCircle} 
                />
              </div>

              {/* Data Management */}
              <section className="bg-gray-900/20 p-5 rounded-2xl border border-gray-800 mt-4">
                 <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                  <Download size={16} /> Veri Yönetimi
                </h3>
                <div className="flex flex-col md:flex-row gap-4">
                  <button 
                    onClick={onExportChat}
                    className="flex-1 py-3 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-700 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Download size={18} /> Sohbeti İndir (.json)
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* --- INTELLIGENCE TAB --- */}
          {activeTab === 'intelligence' && (
            <div className="space-y-8 max-w-2xl mx-auto animate-fade-in">
              
              {/* Persona Input */}
              <section>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                    <Zap size={16} className={theme.text} /> Sistem Talimatı (Persona)
                  </label>
                  <span className="text-[10px] text-gray-500">Modelin nasıl davranacağını belirler</span>
                </div>
                <textarea
                  className="w-full h-32 bg-gray-950 border border-gray-800 rounded-xl p-4 text-sm text-gray-200 focus:ring-1 focus:ring-gray-600 resize-none custom-scrollbar leading-relaxed"
                  value={personaText}
                  onChange={(e) => setPersonaText(e.target.value)}
                  placeholder="Örn: Sen bir tarih öğretmenisin..."
                />
              </section>

              {/* Sliders */}
              <section className="space-y-6 bg-gray-900/20 p-6 rounded-2xl border border-gray-800">
                
                {/* Temperature */}
                <div>
                   <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-gray-300">Yaratıcılık (Temperature)</label>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded bg-gray-900 ${theme.text}`}>{temperature}</span>
                   </div>
                   <input 
                      type="range" min="0" max="1" step="0.1" 
                      value={temperature} onChange={(e) => onSaveTemperature(parseFloat(e.target.value))}
                      className={`w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-${currentColor}-500`}
                      style={{ accentColor: THEMES[currentColor].primary.replace('bg-','') }}
                   />
                   <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
                      <span>0.0 (Robotik)</span>
                      <span>1.0 (Rastgele)</span>
                   </div>
                </div>

                {/* Top P */}
                <div>
                   <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-gray-300">Çeşitlilik (Top P)</label>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded bg-gray-900 ${theme.text}`}>{topP}</span>
                   </div>
                   <input 
                      type="range" min="0.1" max="1" step="0.05" 
                      value={topP} onChange={(e) => onSaveTopP(parseFloat(e.target.value))}
                      className={`w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer`}
                      style={{ accentColor: THEMES[currentColor].primary.replace('bg-','') }}
                   />
                   <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
                      <span>0.1 (Odaklı)</span>
                      <span>1.0 (Geniş Havuz)</span>
                   </div>
                </div>

                {/* Max Tokens */}
                <div>
                   <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-gray-300">Maksimum Uzunluk (Tokens)</label>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded bg-gray-900 ${theme.text}`}>{maxOutputTokens}</span>
                   </div>
                   <input 
                      type="range" min="100" max="8192" step="100" 
                      value={maxOutputTokens} onChange={(e) => onSaveMaxOutputTokens(parseInt(e.target.value))}
                      className={`w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer`}
                      style={{ accentColor: THEMES[currentColor].primary.replace('bg-','') }}
                   />
                   <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
                      <span>100 (Kısa)</span>
                      <span>8192 (Makale)</span>
                   </div>
                </div>

              </section>

              {/* Context Limit */}
              <div>
                 <label className="block text-sm font-medium text-gray-300 mb-3">Hafıza Derinliği (Context)</label>
                 <div className="grid grid-cols-3 gap-3">
                   {[
                      { id: 'low', label: 'Kısa', desc: '5 Mesaj' },
                      { id: 'medium', label: 'Dengeli', desc: '15 Mesaj' },
                      { id: 'high', label: 'Uzun', desc: '30 Mesaj' }
                   ].map((opt) => (
                      <button
                         key={opt.id}
                         onClick={() => onSaveContextLimit(opt.id as any)}
                         className={`p-3 rounded-xl border transition-all text-left active:scale-95 ${
                            contextLimit === opt.id 
                            ? `${theme.iconBg} ${theme.border} ${theme.text}` 
                            : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'
                         }`}
                      >
                         <div className="font-bold text-xs uppercase tracking-wide">{opt.label}</div>
                         <div className="text-[10px] opacity-70 mt-1">{opt.desc}</div>
                      </button>
                   ))}
                 </div>
              </div>

            </div>
          )}

          {/* --- APPEARANCE TAB --- */}
          {activeTab === 'appearance' && (
            <div className="space-y-8 max-w-2xl mx-auto animate-fade-in">
               
               {/* Theme Color */}
               <section>
                  <label className="block text-sm font-bold text-gray-400 uppercase mb-3">Renk Teması</label>
                  <div className="flex items-center gap-4 overflow-x-auto pb-2 custom-scrollbar">
                    {Object.keys(THEMES).map((colorKey) => (
                      <button
                        key={colorKey}
                        onClick={() => onSaveColor(colorKey)}
                        className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center transition-all border-2 ${
                          currentColor === colorKey ? 'border-white scale-110 shadow-xl' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                        } ${THEMES[colorKey].primary}`}
                      >
                        {currentColor === colorKey && <Check size={20} className="text-white" />}
                      </button>
                    ))}
                  </div>
               </section>

               {/* Font Family Selection */}
               <div className="bg-gray-900/30 p-5 rounded-xl border border-gray-800">
                 <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-4">
                   <Type size={16} /> Yazı Tipi (Font)
                 </label>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                   {fontOptions.map((font) => (
                     <button
                       key={font.id}
                       onClick={() => onSaveFontFamily && onSaveFontFamily(font.id)}
                       className={`relative p-3 rounded-xl border text-left transition-all group active:scale-95 ${
                         fontFamily === font.id 
                           ? `${theme.border} ${theme.iconBg} shadow-md` 
                           : 'border-gray-800 bg-gray-900/50 hover:bg-gray-800'
                       }`}
                     >
                       <div className={`text-lg mb-1 ${font.id}`}>Ag</div>
                       <div className="text-xs font-bold text-gray-300 truncate">{font.name}</div>
                       <div className="text-[10px] text-gray-500 truncate">{font.desc}</div>
                       
                       {/* Selection Indicator */}
                       {fontFamily === font.id && (
                         <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${theme.primary}`}></div>
                       )}

                       {/* Download Button */}
                       <a
                          href={font.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={`absolute bottom-2 right-2 p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100 z-10 ${theme.primary} text-white hover:scale-110 shadow-lg`}
                          title={`${font.name} fontunu indir`}
                       >
                          <DownloadCloud size={12} />
                       </a>
                     </button>
                   ))}
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Font Size */}
                  <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-800">
                     <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                       <Type size={16} /> Yazı Boyutu
                     </label>
                     <div className="flex gap-2">
                        {['normal', 'large', 'xl'].map(size => (
                           <button
                              key={size}
                              onClick={() => onSaveFontSize(size as any)}
                              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all active:scale-95 ${fontSize === size ? `${theme.primary} text-white shadow-lg` : 'bg-gray-800 text-gray-400'}`}
                           >
                              {size}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Layout Config */}
                  <div className="bg-gray-900/30 p-4 rounded-xl border border-gray-800">
                     <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                       <Layout size={16} /> Yerleşim
                     </label>
                     <div className="flex gap-2 mb-2">
                        <button onClick={() => onSaveSidebarPosition('left')} className={`flex-1 py-1.5 text-[10px] uppercase font-bold rounded transition-all active:scale-95 ${sidebarPosition === 'left' ? theme.text + ' bg-gray-800 shadow' : 'text-gray-500'}`}>Sol Menü</button>
                        <button onClick={() => onSaveSidebarPosition('right')} className={`flex-1 py-1.5 text-[10px] uppercase font-bold rounded transition-all active:scale-95 ${sidebarPosition === 'right' ? theme.text + ' bg-gray-800 shadow' : 'text-gray-500'}`}>Sağ Menü</button>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => onSaveChatWidth('normal')} className={`flex-1 py-1.5 text-[10px] uppercase font-bold rounded transition-all active:scale-95 ${chatWidth === 'normal' ? theme.text + ' bg-gray-800 shadow' : 'text-gray-500'}`}>Odaklı</button>
                        <button onClick={() => onSaveChatWidth('full')} className={`flex-1 py-1.5 text-[10px] uppercase font-bold rounded transition-all active:scale-95 ${chatWidth === 'full' ? theme.text + ' bg-gray-800 shadow' : 'text-gray-500'}`}>Tam Ekran</button>
                     </div>
                  </div>
               </div>

               {/* Visual Toggles */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ToggleItem 
                     label="Avatarları Göster" 
                     desc="Mesajların yanında ikonlar" 
                     checked={showAvatars} 
                     onChange={onSaveShowAvatars} 
                     icon={UserCircle} 
                  />
                  <ToggleItem 
                     label="Daktilo Efekti" 
                     desc="Yazı animasyonu" 
                     checked={typingEffect} 
                     onChange={onSaveTypingEffect} 
                     icon={Zap} 
                  />
                  <ToggleItem 
                     label="Gecikme Göstergesi" 
                     desc="Ping süresini göster" 
                     checked={showLatency} 
                     onChange={onSaveShowLatency} 
                     icon={Activity} 
                  />
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900/30 hover:bg-gray-900/60 border border-gray-800/50 transition-colors">
                     <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-800 text-gray-400"><Clock size={18} /></div>
                        <span className="text-sm font-medium text-gray-200">Saat Biçimi</span>
                     </div>
                     <button 
                        onClick={() => onSaveTimeFormat(timeFormat === '12h' ? '24h' : '12h')}
                        className="text-xs font-bold bg-gray-800 px-3 py-1.5 rounded-lg text-white transition-all active:scale-95"
                     >
                        {timeFormat}
                     </button>
                  </div>
               </div>
            </div>
          )}

          {/* --- ADVANCED TAB --- */}
          {activeTab === 'advanced' && (
            <div className="space-y-6 max-w-2xl mx-auto animate-fade-in flex flex-col justify-center min-h-[50vh]">
               <div className="p-8 rounded-2xl bg-gradient-to-b from-red-950/20 to-transparent border border-red-900/30 text-center shadow-inner">
                  <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-red-500/50">
                    <ShieldAlert size={32} className="text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Uygulama Verilerini Sıfırla</h3>
                  <p className="text-sm text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                     Bu işlem, tüm sohbet geçmişinizi, kişisel ayarlarınızı ve kayıtlı verilerinizi bu tarayıcıdan kalıcı olarak silecektir. Bu işlem geri alınamaz.
                  </p>
                  <button 
                     onClick={() => {
                        if (window.confirm("DİKKAT: Tüm verileriniz silinecek. Devam etmek istiyor musunuz?")) {
                           onResetData();
                           onClose();
                        }
                     }}
                     className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 mx-auto shadow-lg shadow-red-600/20 hover:shadow-red-600/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                  >
                     <Trash2 size={18} />
                     Verileri Sıfırla
                  </button>
               </div>
               
               <div className="text-center mt-4 space-y-2">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Sistem Bilgileri</p>
                  <div className="inline-flex flex-col gap-1">
                    <div className="px-3 py-1 bg-gray-900 rounded border border-gray-800 text-[10px] text-gray-400 font-mono">
                      Td AI v2.5.0
                    </div>
                    <div className="text-[10px] text-gray-600">
                      Powered by Tda Company
                    </div>
                  </div>
               </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-gray-950 border-t border-gray-800 p-4 flex justify-end gap-3 shrink-0 z-20">
           <button 
             onClick={onClose}
             className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-900 transition-all active:scale-95"
           >
             İptal
           </button>
           <button 
             onClick={handleSaveAll}
             className={`px-8 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${theme.primary} ${theme.primaryHover}`}
           >
             Kaydet & Kapat
           </button>
        </div>

      </div>
    </div>
  );
};