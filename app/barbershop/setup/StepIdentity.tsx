// app/barbershop/setup/StepIdentity.tsx
'use client';

import { useState } from 'react';

interface Props {
  data: {
    colors: string[];
    theme: 'MODERN' | 'CLASSIC' | 'VINTAGE';
    logo: string;
  };
  onUpdate: (data: any) => void;
  onNext: () => void;
}

const PRESET_COLORS = [
  '#FF5733', '#C70039', '#900C3F', '#581845', '#1A1A2E',
  '#0F3460', '#16213E', '#E94560', '#533483', '#6A2C70',
  '#F08A5D', '#B83B5E', '#6A2C70', '#08D9D6', '#FF2E63',
  '#252A34', '#EAEAEA', '#FF6464', '#08D9D6', '#FFE400',
];

const THEMES = [
  { value: 'MODERN', label: 'Moderno', emoji: '✨', desc: 'Limpio y minimalista' },
  { value: 'CLASSIC', label: 'Clásico', emoji: '🎩', desc: 'Elegante y tradicional' },
  { value: 'VINTAGE', label: 'Vintage', emoji: '📻', desc: 'Retro y nostálgico' },
] as const;

export default function StepIdentity({ data, onUpdate, onNext }: Props) {
  const [selectedColors, setSelectedColors] = useState<string[]>(data.colors);
  const [customColor, setCustomColor] = useState('#000000');

  const handleColorSelect = (color: string) => {
    if (selectedColors.includes(color)) {
      setSelectedColors(selectedColors.filter((c) => c !== color));
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
    if (selectedColors.length < 2) {
      alert('Selecciona al menos 2 colores');
      return;
    }
    onUpdate({ colors: selectedColors });
    onNext();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🎨 Identidad Visual
        </h2>
        <p className="text-gray-600">
          Elige los colores y el tema que representan tu barbería
        </p>
      </div>

      {/* Selector de Tema */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Tema de tu página
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {THEMES.map((theme) => (
            <button
              key={theme.value}
              onClick={() => onUpdate({ theme: theme.value })}
              className={`
                p-4 rounded-lg border-2 transition text-left
                ${data.theme === theme.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="text-3xl mb-2">{theme.emoji}</div>
              <h3 className="font-semibold text-gray-900">{theme.label}</h3>
              <p className="text-sm text-gray-500">{theme.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Selector de Colores */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Paleta de colores (2-5 colores)
        </label>
        
        {/* Colores seleccionados */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            Colores seleccionados: {selectedColors.length}/5
          </p>
          <div className="flex gap-2 flex-wrap">
            {selectedColors.map((color) => (
              <div
                key={color}
                className="relative group"
              >
                <div
                  className="w-12 h-12 rounded-lg border-2 border-white shadow-md cursor-pointer"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                />
                <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    className="bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                    onClick={() => handleColorSelect(color)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Colores predefinidos */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Colores sugeridos:</p>
          <div className="grid grid-cols-10 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className={`
                  w-full aspect-square rounded-lg border-2 transition
                  ${selectedColors.includes(color)
                    ? 'border-blue-600 scale-110'
                    : 'border-gray-200 hover:scale-105'
                  }
                `}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Color personalizado */}
        <div>
          <p className="text-sm text-gray-600 mb-2">O elige un color personalizado:</p>
          <div className="flex gap-2">
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="#000000"
            />
            <button
              onClick={handleAddCustomColor}
              disabled={selectedColors.length >= 5}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Agregar
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="p-6 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-700 mb-3">Vista previa:</p>
        <div className="flex gap-2 h-20 rounded-lg overflow-hidden">
          {selectedColors.map((color, index) => (
            <div
              key={index}
              className="flex-1 flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: color }}
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={selectedColors.length < 2}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}