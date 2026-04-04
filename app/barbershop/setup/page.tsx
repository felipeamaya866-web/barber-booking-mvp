// app/barbershop/setup/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import StepIdentity from './StepIdentity';
import StepBio from './StepBio';
import StepGallery from './StepGallery';
import StepPlan from './StepPlan';

export default function SetupWizard() {
  const router = useRouter();
  const { status } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    // Paso 1: Identidad Visual
    colors: [] as string[],
    theme: 'MODERN' as 'MODERN' | 'CLASSIC' | 'VINTAGE',
    logo: '' as string,
    
    // Paso 2: Biografía
    bio: '',
    
    // Paso 3: Galería
    photos: [] as string[],
    
    // Paso 4: Plan
    plan: 'LITE' as 'LITE' | 'PRIME' | 'ELITE',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const res = await fetch('/api/barbershop/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar configuración');
      }

      console.log('✅ Setup completado:', data.slug);
      
      // Redirigir al dashboard
      router.push('/barbershop');
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Identidad Visual', icon: '🎨' },
    { number: 2, title: 'Biografía', icon: '📝' },
    { number: 3, title: 'Galería', icon: '📸' },
    { number: 4, title: 'Plan', icon: '💳' },
  ];

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            🎨 Personaliza tu Barbería
          </h1>
          <p className="text-gray-600">
            Crea la identidad visual de tu negocio en 4 simples pasos
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex-1">
                <div className="flex items-center">
                  {/* Circle */}
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm
                    ${currentStep >= step.number
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}>
                    {currentStep > step.number ? '✓' : step.number}
                  </div>

                  {/* Line */}
                  {index < steps.length - 1 && (
                    <div className={`
                      flex-1 h-1 mx-2
                      ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
                
                {/* Label */}
                <div className="mt-2 hidden sm:block">
                  <p className={`text-xs font-medium ${
                    currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.icon} {step.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
          {currentStep === 1 && (
            <StepIdentity
              data={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
            />
          )}

          {currentStep === 2 && (
            <StepBio
              data={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && (
            <StepGallery
              data={formData}
              onUpdate={updateFormData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 4 && (
            <StepPlan
              data={formData}
              onUpdate={updateFormData}
              onBack={handleBack}
              onSubmit={handleSubmit}
              loading={loading}
            />
          )}
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-gray-500">
          <p>¿Necesitas ayuda? Contáctanos en soporte@tuapp.com</p>
        </div>
      </div>
    </div>
  );
}