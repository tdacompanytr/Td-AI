
import React from 'react';
import { X, Check } from 'lucide-react';
import { THEMES } from '../utils/theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPersona: string;
  onSavePersona: (persona: string) => void;
  currentColor: string;
  onSaveColor: (color: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentPersona,
  onSavePersona,
  currentColor,
  onSaveColor,
}) => {
  const [personaText, setPersonaText] = React.useState(currentPersona);
  const [selectedColor, setSelectedColor] = React.useState(currentColor);

  React.useEffect(() => {
    setPersonaText(currentPersona);
    setSelectedColor(currentColor);
  }, [currentPersona, currentColor, isOpen]);

  const handleSave = () => {
    onSavePersona(personaText);
    onSaveColor(selectedColor);
    onClose();
  };

  const theme = THEMES[currentColor] || THEMES.red;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className={`bg-gray-900 w-full max-w-lg rounded-2xl border border-gray-800 shadow-2xl transform transition-transform duration-300 ${isOpen ? 'scale-100' : 'scale-95'}`}>
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Ayarlar</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Persona Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Yapay Zeka Kişiliği (System Instruction)
            </label>
            <textarea
              className={`w-full h-48 bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:border-transparent resize-none transition-all ${THEMES[selectedColor].ring.replace('focus:', 'focus-within:')}`}
              value={personaText}
              onChange={(e) => setPersonaText(e.target.value)}
              placeholder="Yapay zekanın nasıl davranması gerektiğini buraya yazın..."
            />
            <p className="text-xs text-gray-500 mt-2">
              Bu ayar yapay zekanın konuşma tarzını ve yeteneklerini belirler.
            </p>
          </div>

          {/* Accent Color Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Tema Rengi
            </label>
            <div className="flex items-center gap-4">
              {Object.keys(THEMES).map((colorKey) => (
                <button
                  key={colorKey}
                  onClick={() => setSelectedColor(colorKey)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${THEMES[colorKey].primary} ${
                    selectedColor === colorKey ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''
                  }`}
                  title={THEMES[colorKey].name}
                >
                  {selectedColor === colorKey && <Check size={16} className="text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${THEMES[selectedColor].primary} ${THEMES[selectedColor].primaryHover}`}
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};
