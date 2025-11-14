import React, { useState } from 'react';
import { User, ArrowRight } from 'lucide-react';
import { THEMES } from '../utils/theme';

interface LoginScreenProps {
  onLogin: (email: string) => void;
  onGuestAccess: () => void;
  accentColor: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onGuestAccess, accentColor }) => {
  const [email, setEmail] = useState('');
  const theme = THEMES[accentColor] || THEMES.red;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onLogin(email);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4 text-white font-sans animate-fade-in relative overflow-hidden">
      {/* Background Effect */}
      <div className={`absolute -top-24 -left-24 w-96 h-96 ${theme.primary} rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse`}></div>
      <div className={`absolute -bottom-24 -right-24 w-96 h-96 ${theme.primary} rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse`}></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <h1 className={`text-5xl font-bold tracking-tighter mb-2 ${theme.text} drop-shadow-lg`}>Td AI</h1>
          <p className="text-gray-400 text-lg">Yeni nesil, samimi yapay zeka asistanı.</p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-xl p-8 rounded-3xl border border-gray-800 shadow-2xl">
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5 ml-1">
                  E-posta Adresi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-500" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    className={`block w-full pl-10 pr-3 py-3 bg-gray-950 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition-all`}
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full flex items-center justify-center py-3 px-4 rounded-xl text-white font-semibold shadow-lg transition-all transform hover:scale-[1.02] ${theme.primary} ${theme.primaryHover}`}
              >
                Giriş Yap
                <ArrowRight size={18} className="ml-2" />
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900/80 text-gray-500">veya</span>
              </div>
            </div>

            <button
              onClick={onGuestAccess}
              className="w-full flex items-center justify-center py-3 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-300 font-medium transition-colors"
            >
              Misafir Olarak Devam Et
            </button>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-600 mt-8">
          Devam ederek, Hizmet Şartlarımızı ve Gizlilik Politikamızı kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  );
};