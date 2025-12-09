import React from 'react';

interface AboutModalProps {
  onClose: () => void;
}

const FeatureItem = ({ icon, title, desc }: { icon: string, title: string, desc: string }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/30 transition-colors">
        <div className="text-2xl shrink-0">{icon}</div>
        <div>
            <h4 className="text-sm font-bold text-indigo-300">{title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
        </div>
    </div>
);

const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-900/50">
           <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">About HighWind's Scrum Poker</h2>
                    <p className="text-xs text-slate-400">Version 1.0.0</p>
                </div>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            
            <div className="prose prose-invert max-w-none mb-8">
                <p className="text-slate-300 text-sm">
                    A feature-rich, real-time estimation tool built for agile teams who value fun and efficiency. 
                    Synchronized instantly across all devices.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
                <FeatureItem 
                    icon="⚡" 
                    title="Real-Time Sync" 
                    desc="Powered by Firebase, all actions (votes, reveals, stories) are instantly synced across all connected clients." 
                />
                <FeatureItem 
                    icon="🤖" 
                    title="Gemini AI Integration" 
                    desc="Chat with an AI Agile Coach or use the Chuck Norris bot for entertainment during downtimes." 
                />
                <FeatureItem 
                    icon="🎭" 
                    title="Multi-Role Support" 
                    desc="Distinct views and permissions for Developers (voters), Scrum Masters (managers), and Product Owners." 
                />
                <FeatureItem 
                    icon="🕹️" 
                    title="Waiting Room Arcade" 
                    desc="Play Tic-Tac-Toe, Snake, Memory Match, or Rock Paper Scissors while waiting for others to vote." 
                />
                <FeatureItem 
                    icon="📱" 
                    title="Responsive Design" 
                    desc="Optimized for Desktop, Tablet, and Mobile. Vote from your phone while the board is on the TV." 
                />
                <FeatureItem 
                    icon="🔊" 
                    title="Interactive Sound" 
                    desc="Audio cues for joining, voting, and revealing. Includes a custom synthesizer to avoid external assets." 
                />
                <FeatureItem 
                    icon="🎉" 
                    title="Celebrations" 
                    desc="Confetti explosions on consensus and interactive emoji reactions that float across everyone's screen." 
                />
                <FeatureItem 
                    icon="⏱️" 
                    title="Integrated Timer" 
                    desc="Scrum Master controlled timer to time-box discussions effectively." 
                />
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                <h3 className="text-sm font-bold text-white mb-2">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                    {['React 18', 'TypeScript', 'Tailwind CSS', 'Firebase Realtime DB', 'Google Gemini API', 'Vite'].map(tech => (
                        <span key={tech} className="px-2 py-1 bg-slate-800 text-xs text-indigo-300 rounded border border-slate-700">
                            {tech}
                        </span>
                    ))}
                </div>
            </div>

        </div>
        
        <div className="p-4 border-t border-slate-700 bg-slate-900/50 text-center">
            <p className="text-xs text-slate-500">
                Made with ❤️ by HighWind
            </p>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;