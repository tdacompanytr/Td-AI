import React, { useState } from 'react';
import { Plus, X, Trash2, LogOut, Share2, MessageSquare, Search } from 'lucide-react';
import { THEMES } from '../utils/theme';
import { ChatSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onDeleteHistory: () => void;
  accentColor?: string;
  currentUser?: { email: string; isGuest: boolean } | null;
  onLogout?: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, onClose, onNewChat, onDeleteHistory, accentColor = 'red', currentUser, onLogout, sessions, currentSessionId, onSelectSession
}) => {
  const theme = THEMES[accentColor] || THEMES.red;
  const [searchTerm, setSearchTerm] = useState('');

  const handleShare = async () => {
    let urlToShare = window.location.href;
    try { new URL(urlToShare); } catch (e) { urlToShare = 'https://tdai.vercel.app'; }
    const shareData = { title: 'Td AI Chatbot', text: 'Td AI ile sohbet et!', url: urlToShare };
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) await navigator.share(shareData);
      else throw new Error('Web Share API unavailable');
    } catch (err) {
      try { await navigator.clipboard.writeText(urlToShare); alert('Bağlantı kopyalandı!'); } catch { alert('Paylaşılamadı.'); }
    }
  };

  const filteredSessions = sessions
    .filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <>
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-all duration-500 ease-smooth lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <aside className={`absolute lg:static top-0 left-0 h-full bg-gray-950/95 backdrop-blur-md border-r border-gray-800/50 w-64 md:w-72 flex flex-col flex-shrink-0 z-40 transition-transform duration-500 ease-smooth transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className={theme.text} size={20}/> Geçmiş
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={onDeleteHistory} className={`p-2 text-gray-400 hover:text-red-500 hover:bg-red-900/20 rounded-full transition-all active:scale-90`} title="Tümünü Sil"><Trash2 size={18}/></button>
            <button onClick={onClose} className="text-gray-400 hover:text-white lg:hidden p-2 transition-transform active:scale-90"><X size={24}/></button>
          </div>
        </div>

        {/* Search & New Chat */}
        <div className="p-3 space-y-3 shrink-0">
          <button onClick={onNewChat} className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-white rounded-xl transition-all shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] ${theme.primary} ${theme.primaryHover}`}>Yeni Sohbet <Plus size={20}/></button>
          
          <div className="relative group">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" />
            <input 
              type="text" 
              placeholder="Sohbet ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full bg-gray-900/50 border border-gray-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-${theme.border} focus:bg-gray-900 transition-all`}
            />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X size={14}/></button>}
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
          {sessions.length === 0 ? (
            <div className="text-center text-gray-500 text-sm p-6 flex flex-col items-center gap-3 animate-fade-in mt-10 opacity-60">
              <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center opacity-50 border border-gray-800 border-dashed"><MessageSquare size={24}/></div>
              <p>Henüz sohbet yok.</p>
            </div>
          ) : filteredSessions.length === 0 ? (
             <div className="text-center text-gray-500 text-sm p-6">Sonuç bulunamadı.</div>
          ) : (
            filteredSessions.map((session) => (
              <button key={session.id} onClick={() => { onSelectSession(session.id); if (window.innerWidth < 1024) onClose(); }} className={`w-full text-left px-3 py-3 rounded-xl text-sm transition-all flex items-center gap-3 group relative overflow-hidden ${currentSessionId === session.id ? `bg-gray-900 text-white shadow-md ring-1 ring-inset ${theme.border} ring-opacity-50` : 'text-gray-400 hover:bg-gray-900/60 hover:text-gray-200 hover:pl-4'}`}>
                <MessageSquare size={16} className={`flex-shrink-0 transition-colors ${currentSessionId === session.id ? theme.text : 'opacity-50 group-hover:opacity-100'}`} />
                <span className="truncate flex-1 font-medium">{session.title}</span>
                {currentSessionId === session.id && <div className={`absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-gray-900 to-transparent`}></div>}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        {currentUser && (
          <div className="p-4 border-t border-gray-800 bg-black/20 shrink-0">
            <div className="flex items-center justify-between mb-3">
               <button onClick={handleShare} className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"><Share2 size={14}/> Paylaş</button>
               <span className="text-[10px] text-gray-600 font-mono">v5.2</span>
            </div>
            <div className="flex items-center justify-between bg-gray-900/50 p-2 rounded-xl border border-gray-800/50">
              <div className="flex flex-col overflow-hidden mr-2 px-1"><span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{currentUser.isGuest ? 'Misafir' : 'Hesap'}</span><span className="text-xs text-white truncate font-bold" title={currentUser.email}>{currentUser.email.split('@')[0]}</span></div>
              <button onClick={(e) => { e.stopPropagation(); if(onLogout) onLogout(); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-950/30 rounded-lg transition-all active:scale-90"><LogOut size={16}/></button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};