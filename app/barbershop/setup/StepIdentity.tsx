// app/barbershop/setup/StepIdentity.tsx
'use client';

import { useState } from 'react';

interface Props {
  data: { colors: string[]; theme: 'MODERN' | 'CLASSIC' | 'VINTAGE'; logo: string };
  onUpdate: (data: any) => void;
  onNext: () => void;
}

const PRESET_COLORS = [
  '#FF5733', '#C70039', '#900C3F', '#581845', '#1A1A2E',
  '#0F3460', '#16213E', '#E94560', '#533483', '#6A2C70',
  '#F08A5D', '#B83B5E', '#08D9D6', '#FF2E63', '#252A34',
  '#EAEAEA', '#FF6464', '#FFE400', '#C9A84C', '#2ECC71',
];

const THEMES = [
  { value: 'MODERN',  label: 'Moderno', emoji: '✨', desc: 'Limpio y minimalista' },
  { value: 'CLASSIC', label: 'Clásico', emoji: '🎩', desc: 'Elegante y tradicional' },
  { value: 'VINTAGE', label: 'Vintage', emoji: '📻', desc: 'Retro y nostálgico' },
] as const;

export default function StepIdentity({ data, onUpdate, onNext }: Props) {
  const [selectedColors, setSelectedColors] = useState<string[]>(data.colors);
  const [customColor, setCustomColor] = useState('#C9A84C');

  const handleColorSelect = (color: string) => {
    if (selectedColors.includes(color)) {
      setSelectedColors(selectedColors.filter(c => c !== color));
    } else if (selectedColors.length < 5) {
      setSelectedColors([...selectedColors, color]);
    }
  };

  const handleAddCustomColor = () => {
    if (!selectedColors.includes(customColor) && selectedColors.length < 5) {
      setSelectedColors([...selectedColors, customColor]);
    }
  };

  const handleNext = () => {
    if (selectedColors.length < 2) { alert('Selecciona al menos 2 colores'); return; }
    onUpdate({ colors: selectedColors });
    onNext();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">🎨 Identidad Visual</h2>
        <p className="text-gray-400">Elige los colores y el tema que representan tu barbería</p>
      </div>

      {/* Tema */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Tema de tu página</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {THEMES.map(theme => (
            <button key={theme.value} onClick={() => onUpdate({ theme: theme.value })}
              className={`p-4 rounded-xl border-2 transition text-left ${
                data.theme === theme.value
                  ? 'border-yellow-400 bg-yellow-400/10'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}>
              <div className="text-3xl mb-2">{theme.emoji}</div>
              <h3 className="font-semibold text-white">{theme.label}</h3>
              <p className="text-sm text-gray-400">{theme.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Colores */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Paleta de colores (2-5 colores)</label>

        {/* Seleccionados */}
        <div className="mb-4 p-4 bg-gray-800 rounded-xl border border-gray-700">
          <p className="text-sm text-gray-400 mb-2">Colores seleccionados: {selectedColors.length}/5</p>
          <div className="flex gap-2 flex-wrap min-h-[48px]">
            {selectedColors.map(color => (
              <div key={color} className="relative group">
                <div className="w-12 h-12 rounded-lg border-2 border-gray-600 shadow cursor-pointer" style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)} />
                <button className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                  onClick={() => handleColorSelect(color)}>×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Predefinidos */}
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">Colores sugeridos:</p>
          <div className="grid grid-cols-10 gap-2">
            {PRESET_COLORS.map(color => (
              <button key={color} onClick={() => handleColorSelect(color)}
                className={`w-full aspect-square rounded-lg border-2 transition ${
                  selectedColors.includes(color) ? 'border-yellow-400 scale-110' : 'border-gray-700 hover:scale-105'
                }`}
                style={{ backgroundColor: color }} title={color} />
            ))}
          </div>
        </div>

        {/* Personalizado */}
        <div>
          <p className="text-sm text-gray-400 mb-2">O elige un color personalizado:</p>
          <div className="flex gap-2">
            <input type="color" value={customColor} onChange={e => setCustomColor(e.target.value)}
              className="h-10 w-20 rounded border border-gray-700 bg-gray-800 cursor-pointer" />
            <input type="text" value={customColor} onChange={e => setCustomColor(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg outline-none focus:border-yellow-400"
              placeholder="#C9A84C" />
            <button onClick={handleAddCustomColor} disabled={selectedColors.length >= 5}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition">
              Agregar
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      {selectedColors.length > 0 && (
        <div className="p-4 bg-gray-800 rounded-xl border border-gray-700">
          <p className="text-sm font-medium text-gray-300 mb-3">Vista previa:</p>
          <div className="flex gap-2 h-16 rounded-lg overflow-hidden">
            {selectedColors.map((color, i) => (
              <div key={i} className="flex-1 flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: color }}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={handleNext} disabled={selectedColors.length < 2}
          className="px-6 py-3 bg-yellow-400 text-gray-900 rounded-lg font-bold hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition">
          Siguiente →
        </button>
      </div>
    </div>
  );
}