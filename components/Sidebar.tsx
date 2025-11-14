import React from 'react';
import { Plus, X, MessageSquare, Trash2, LogOut } from 'lucide-react';
import { THEMES } from '../utils/theme';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onDeleteHistory: () => void;
  accentColor?: string;
  currentUser?: { email: string; isGuest: boolean } | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onNewChat, 
  onDeleteHistory, 
  accentColor = 'red',
  currentUser,
  onLogout
}) => {
  const theme = THEMES[accentColor] || THEMES.red;

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black/60 z-30 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <aside 
        className={`absolute lg:static top-0 left-0 h-full bg-gray-950 border-r border-gray-800 w-64 md:w-72 flex flex-col flex-shrink-0 z-40 transition-transform transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Sohbet Geçmişi</h2>
          <div className="flex items-center gap-1">
            <button 
              onClick={onDeleteHistory}
              className={`p-2 text-gray-400 hover:${theme.text} hover:bg-gray-900/50 rounded-full transition-colors`}
              title="Geçmişi Sil"
            >
              <Trash2 size={18} />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white lg:hidden p-2">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-2">
          <button 
            onClick={onNewChat}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors ${theme.primary} ${theme.primaryHover}`}
          >
            Yeni Sohbet
            <Plus size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="text-center text-gray-500 text-sm p-4">
            Henüz sohbet geçmişin yok.
          </div>
        </div>

        {/* User Footer */}
        {currentUser && (
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex flex-col overflow-hidden mr-2">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  {currentUser.isGuest ? 'Misafir' : 'Kullanıcı'}
                </span>
                <span className="text-sm text-white truncate font-medium" title={currentUser.email}>
                  {currentUser.email}
                </span>
              </div>
              <button 
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-900 rounded-full transition-colors"
                title="Çıkış Yap"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};