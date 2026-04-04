// app/barbershop/setup/StepBio.tsx
'use client';

import { useState } from 'react';

interface Props {
  data: { bio: string };
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const BIO_EXAMPLES = [
  "Somos una barbería moderna con más de 10 años de experiencia. Nuestro equipo de profesionales está dedicado a brindarte el mejor servicio y los cortes más actuales. Utilizamos productos de primera calidad y técnicas vanguardistas.",
  "Barbería tradicional con alma contemporánea. Aquí encontrarás desde el clásico corte a navaja hasta los estilos más modernos. Ambiente relajado, música en vivo los viernes y café artesanal de cortesía.",
  "Expertos en estilo masculino desde 2010. Ofrecemos cortes premium, afeitado tradicional y tratamientos capilares. Cada visita es una experiencia única donde combinamos tradición y tendencia.",
];

export default function StepBio({ data, onUpdate, onNext, onBack }: Props) {
  const [bio, setBio] = useState(data.bio);
  const charCount = bio.length;
  const minChars = 50;
  const maxChars = 500;

  const handleNext = () => {
    if (charCount < minChars) {
      alert(`La biografía debe tener al menos ${minChars} caracteres`);
      return;
    }
    onUpdate({ bio });
    onNext();
  };

  const useExample = (example: string) => {
    setBio(example);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          📝 Cuéntanos sobre tu Barbería
        </h2>
        <p className="text-gray-600">
          Escribe una biografía atractiva que cautive a tus clientes
        </p>
      </div>

      {/* Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Biografía *
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={8}
          maxLength={maxChars}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Escribe una descripción convincente de tu barbería, tu experiencia, servicios especiales, ambiente, etc..."
        />
        
        {/* Character counter */}
        <div className="flex justify-between mt-2">
          <p className={`text-sm ${charCount < minChars ? 'text-red-600' : 'text-gray-500'}`}>
            {charCount < minChars 
              ? `Faltan ${minChars - charCount} caracteres (mínimo ${minChars})`
              : `${charCount}/${maxChars} caracteres`
            }
          </p>
          {charCount >= minChars && charCount <= maxChars && (
            <p className="text-sm text-green-600">✓ Listo</p>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Tips para una buena biografía:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Menciona tu experiencia y años en el negocio</li>
          <li>Describe tu estilo y especialidades</li>
          <li>Habla sobre el ambiente de tu local</li>
          <li>Incluye servicios especiales o extras</li>
        </ul>
      </div>

      {/* Examples */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Ejemplos para inspirarte:
        </h3>
        <div className="space-y-2">
          {BIO_EXAMPLES.map((example, index) => (
            <button
              key={index}
              onClick={() => useExample(example)}
              className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-sm text-gray-700 transition"
            >
              {example.substring(0, 100)}...
            </button>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
        >
          ← Atrás
        </button>
        <button
          onClick={handleNext}
          disabled={charCount < minChars}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}