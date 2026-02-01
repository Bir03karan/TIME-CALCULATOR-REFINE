
import React, { useState } from 'react';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const slides = [
    {
      icon: 'architecture',
      title: 'Precision Capture',
      description: 'Log time with unmatched flexibility. Our parser handles any range format with billable accuracy.',
      color: 'text-primary',
      bg: 'bg-primary/5'
    },
    {
      icon: 'dynamic_form',
      title: 'Smart Analytics',
      description: 'Visualize work-day intensity and identify peak productivity cycles with intelligent insights.',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/5'
    },
    {
      icon: 'verified',
      title: 'Workflow Perfected',
      description: 'Maintain a pristine session history. Export verified reports for stakeholders instantly.',
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/5'
    }
  ];

  const handleNext = () => {
    if (step < slides.length - 1) setStep(step + 1);
    else onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-[#0b0e14] flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-12 text-center space-y-16">
        <div className={`size-40 rounded-[3.5rem] ${slides[step].bg} flex items-center justify-center shadow-inner border border-white/20 transition-all duration-1000 ease-in-out ${slides[step].color} transform hover:rotate-6`}>
          <span className="material-symbols-outlined text-7xl animate-in zoom-in-75 duration-700">
            {slides[step].icon}
          </span>
        </div>
        
        <div className="space-y-6 max-w-sm mx-auto">
          <h2 className="text-4xl font-semibold tracking-tighter text-[#111318] dark:text-white animate-in slide-in-from-bottom-8 duration-700">
            {slides[step].title}
          </h2>
          <p className="text-base font-medium text-gray-400 leading-relaxed animate-in fade-in duration-1000 px-4">
            {slides[step].description}
          </p>
        </div>

        <div className="flex gap-3">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${step === i ? 'w-12 bg-primary' : 'w-2 bg-gray-100 dark:bg-gray-800'}`}
            />
          ))}
        </div>
      </div>

      <div className="p-12 space-y-6">
        <button 
          onClick={handleNext}
          className="w-full h-20 bg-primary text-white rounded-[2.5rem] font-medium text-sm uppercase tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(19,91,236,0.3)] active:scale-95 transition-all flex items-center justify-center gap-4 group"
        >
          {step === slides.length - 1 ? 'Unlock Dashboard' : 'Continue'}
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
        </button>
        {step < slides.length - 1 && (
          <button 
            onClick={onComplete}
            className="w-full text-[11px] font-medium text-gray-400 uppercase tracking-[0.3em] hover:text-primary transition-colors"
          >
            Skip Intro
          </button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
