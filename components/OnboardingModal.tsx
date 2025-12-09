import React, { useState } from 'react';
import Button from './Button';

interface OnboardingModalProps {
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to HighWind's Scrum Poker",
      emoji: "👋",
      content: (
        <div className="space-y-4 text-center">
          <p className="text-slate-300">
            A real-time, AI-powered estimation tool designed for modern agile teams.
          </p>
          <div className="flex justify-center gap-4 text-2xl">
            <span>🚀</span>
            <span>🃏</span>
            <span>🤖</span>
          </div>
          <p className="text-sm text-slate-400">
            Let's take a quick tour to get you started!
          </p>
        </div>
      )
    },
    {
      title: "Roles & Permissions",
      emoji: "👥",
      content: (
        <div className="space-y-3 text-left bg-slate-900/50 p-4 rounded-lg border border-slate-700">
          <div className="flex items-start gap-3">
            <span className="text-xl">👨‍💻</span>
            <div>
              <strong className="text-indigo-400">Developer:</strong>
              <p className="text-xs text-slate-400">The only role that can vote on stories.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">👨‍🍳</span>
            <div>
              <strong className="text-indigo-400">Scrum Master:</strong>
              <p className="text-xs text-slate-400">Controls the flow, reveals votes, and manages stories.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">👑</span>
            <div>
              <strong className="text-indigo-400">Product Owner:</strong>
              <p className="text-xs text-slate-400">Observes and provides story context.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "The Workflow",
      emoji: "🔄",
      content: (
        <ul className="space-y-4 text-sm text-slate-300 list-disc list-inside bg-slate-900/50 p-4 rounded-lg border border-slate-700">
          <li>The <strong>Scrum Master</strong> selects a story to estimate.</li>
          <li><strong>Developers</strong> pick a card. Cards are hidden 🃏 until reveal.</li>
          <li>Once everyone votes, the Scrum Master <strong>Reveals</strong> the results.</li>
          <li>Discuss outliers, then <strong>Finish</strong> the story with a final score.</li>
        </ul>
      )
    },
    {
      title: "Fun & Extras",
      emoji: "🎉",
      content: (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 p-3 rounded border border-slate-700 text-center">
            <div className="text-2xl mb-1">🤠</div>
            <div className="font-bold text-xs text-indigo-300">Chuck Norris</div>
            <p className="text-[10px] text-slate-400">Summon jokes in chat</p>
          </div>
          <div className="bg-slate-900/50 p-3 rounded border border-slate-700 text-center">
            <div className="text-2xl mb-1">🕹️</div>
            <div className="font-bold text-xs text-indigo-300">Arcade</div>
            <p className="text-[10px] text-slate-400">Play games while waiting</p>
          </div>
          <div className="bg-slate-900/50 p-3 rounded border border-slate-700 text-center">
            <div className="text-2xl mb-1">🤖</div>
            <div className="font-bold text-xs text-indigo-300">AI Chat</div>
            <p className="text-[10px] text-slate-400">Ask Gemini for help</p>
          </div>
          <div className="bg-slate-900/50 p-3 rounded border border-slate-700 text-center">
            <div className="text-2xl mb-1">🔊</div>
            <div className="font-bold text-xs text-indigo-300">Sounds</div>
            <p className="text-[10px] text-slate-400">Interactive SFX</p>
          </div>
        </div>
      )
    }
  ];

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header Image/Icon */}
        <div className="bg-gradient-to-r from-indigo-900/50 to-cyan-900/50 p-6 flex justify-center border-b border-slate-700">
          <div className="text-6xl animate-bounce">{currentStep.emoji}</div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col">
          <h2 className="text-xl font-bold text-white text-center mb-4">{currentStep.title}</h2>
          
          <div className="flex-1 mb-6">
            {currentStep.content}
          </div>

          {/* Indicators */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-indigo-500' : 'w-1.5 bg-slate-600'}`}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex justify-between gap-3">
             <Button 
                variant="ghost" 
                onClick={onClose} 
                className="text-xs text-slate-500 hover:text-slate-300"
             >
               Skip
             </Button>

             <div className="flex gap-2">
                {step > 0 && (
                  <Button variant="secondary" onClick={() => setStep(s => s - 1)}>
                    Back
                  </Button>
                )}
                
                {step < steps.length - 1 ? (
                  <Button onClick={() => setStep(s => s + 1)}>
                    Next
                  </Button>
                ) : (
                  <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={onClose}>
                    Let's Go!
                  </Button>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;