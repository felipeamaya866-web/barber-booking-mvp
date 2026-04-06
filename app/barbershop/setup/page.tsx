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

  const [formData, setFormData] = useState({
    colors: [] as string[],
    theme: 'MODERN' as 'MODERN' | 'CLASSIC' | 'VINTAGE',
    logo: '' as string,
    bio: '',
    photos: [] as string[],
    plan: 'LITE' as 'LITE' | 'PRIME' | 'ELITE',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < 4) { setCurrentStep(currentStep + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };
  const handleBack = () => {
    if (currentStep > 1) { setCurrentStep(currentStep - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/barbershop/setup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar configuración');
      router.push('/barbershop');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Identidad Visual', icon: '🎨' },
    { number: 2, title: 'Biografía',        icon: '📝' },
    { number: 3, title: 'Galería',          icon: '📸' },
    { number: 4, title: 'Plan',             icon: '💳' },
  ];

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-xl flex items-center justify-center text-lg">✂️</div>
            <span style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 700, color: '#F5F0E8' }}>
              Barber<span style={{ color: '#C9A84C' }}>Booking</span>
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">🎨 Personaliza tu Barbería</h1>
          <p className="text-gray-400">Crea la identidad visual de tu negocio en 4 simples pasos</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex-1">
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm flex-shrink-0 ${
                    currentStep >= step.number
                      ? 'bg-yellow-400 text-gray-900'
                      : 'bg-gray-800 text-gray-500 border border-gray-700'
                  }`}>
                    {currentStep > step.number ? '✓' : step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.number ? 'bg-yellow-400' : 'bg-gray-800'}`} />
                  )}
                </div>
                <div className="mt-2 hidden sm:block">
                  <p className={`text-xs font-medium ${currentStep >= step.number ? 'text-yellow-400' : 'text-gray-600'}`}>
                    {step.icon} {step.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
          {currentStep === 1 && <StepIdentity data={formData} onUpdate={updateFormData} onNext={handleNext} />}
          {currentStep === 2 && <StepBio      data={formData} onUpdate={updateFormData} onNext={handleNext} onBack={handleBack} />}
          {currentStep === 3 && <StepGallery  data={formData} onUpdate={updateFormData} onNext={handleNext} onBack={handleBack} />}
          {currentStep === 4 && <StepPlan     data={formData} onUpdate={updateFormData} onBack={handleBack} onSubmit={handleSubmit} loading={loading} />}
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>¿Necesitas ayuda? Contáctanos en soporte@barberbooking.co</p>
        </div>
      </div>
    </div>
  );
}