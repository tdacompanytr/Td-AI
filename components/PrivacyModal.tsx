import React from 'react';
import { Shield, Lock, Check, FileText, Server, Database, Eye, AlertCircle, Cookie } from 'lucide-react';

interface PrivacyModalProps {
  onAccept: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ onAccept }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-gray-950 w-full max-w-2xl max-h-[90vh] rounded-3xl border border-gray-800 shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 bg-gray-900/50 flex items-center gap-4 shrink-0">
          <div className="p-3 rounded-full bg-red-600/20 text-red-500">
            <Shield size={32} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Gizlilik Politikası ve Çerez Kullanımı</h1>
            <p className="text-sm text-gray-400">Uygulamayı kullanmaya başlamadan önce lütfen onaylayın.</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-8 text-gray-300 leading-relaxed">
          
          <section>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Database size={20} className="text-red-500"/> 1. Veri Saklama ve Yerel Depolama
            </h3>
            <p className="text-sm">
              Td AI, <strong>yerel odaklı (local-first)</strong> bir uygulamadır. Sohbet geçmişiniz, API anahtarlarınız, ayarlarınız ve oluşturduğunuz görsellerin hiçbiri Td AI sunucularında saklanmaz. Tüm bu veriler, tarayıcınızın <code>LocalStorage</code> alanında şifrelenmemiş ham veri olarak tutulur. Tarayıcı önbelleğini temizlediğinizde bu veriler silinebilir.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Server size={20} className="text-red-500"/> 2. Google Gemini API Kullanımı
            </h3>
            <p className="text-sm">
              Uygulama, yapay zeka yanıtları oluşturmak için <strong>Google Gemini API</strong> servislerini kullanır. Gönderdiğiniz mesajlar ve görseller, işlenmek üzere doğrudan Google sunucularına iletilir. Bu süreçte verileriniz Google'ın <a href="https://ai.google.dev/gemini-api/terms" target="_blank" className="text-red-400 underline hover:text-red-300 transition-colors">Gemini API Kullanım Şartları</a>'na ve Gizlilik Politikası'na tabidir.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Eye size={20} className="text-red-500"/> 3. Kullanıcı Sorumluluğu
            </h3>
            <p className="text-sm">
              Bu uygulama aracılığıyla ürettiğiniz içeriklerden tamamen siz sorumlusunuz. Td AI, yapay zeka tarafından üretilen hatalı, yanıltıcı veya uygunsuz içeriklerden sorumlu tutulamaz. Lütfen hassas kişisel verilerinizi (TCKN, Kredi Kartı vb.) sohbete yazmayınız.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Cookie size={20} className="text-red-500"/> 4. Çerez (Cookie) ve İzleme Politikası
            </h3>
            <p className="text-sm">
              Bu uygulama, deneyiminizi kişiselleştirmek (tema rengi, yazı tipi boyutu, ses ayarları vb.) ve oturum sürekliliğini sağlamak amacıyla tarayıcı çerezlerini ve yerel depolama teknolojilerini kullanır. Hizmeti kullanarak, bu teknolojilerin cihazınızda veri saklamasına izin vermiş olursunuz.
            </p>
          </section>

          <section className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 flex gap-3 items-start">
            <AlertCircle size={24} className="text-red-500 shrink-0 mt-0.5" />
            <div className="text-xs text-gray-400">
              <strong className="text-gray-200 block mb-1">Önemli Uyarı:</strong>
              Bu uygulama açık kaynaklı bir projedir ve "olduğu gibi" sunulmaktadır. Herhangi bir garanti verilmemektedir. Verilerinizi düzenli olarak "Ayarlar > Gelişmiş > Yedekle" seçeneği ile yedeklemeniz önerilir.
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-gray-900/50 shrink-0 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500 text-center md:text-left">
                Devam ederek Gizlilik Politikası ve Çerez Kullanımını kabul etmiş sayılırsınız.
            </p>
            <button 
                onClick={onAccept}
                className="w-full md:w-auto px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 text-sm"
            >
                <Check size={18} />
                Gizlilik ve Çerezleri Kabul Et
            </button>
        </div>

      </div>
    </div>
  );
};