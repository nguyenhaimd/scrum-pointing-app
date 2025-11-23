
import React, { useState } from 'react';
import { ROLES, AVATARS } from '../constants';
import { UserRole, User } from '../types';
import Button from './Button';

interface LoginProps {
  onJoin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onJoin }) => {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('planning');
  const [role, setRole] = useState<UserRole>(UserRole.DEVELOPER);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !room.trim()) return;

    const newUser: User = {
      id: crypto.randomUUID(),
      name: name.trim(),
      role,
      isOnline: true,
      lastHeartbeat: Date.now(),
      room: room.trim(),
      avatar: selectedAvatar,
      deviceType: getDeviceType()
    };
    onJoin(newUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-6 md:p-8 my-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-full bg-indigo-500/10 mb-4">
             <span className="text-4xl">🃏</span>
          </div>
          <h1 className="text-3xl font-bold text-white">
            Scrum Poker
          </h1>
          <p className="text-slate-400 mt-2">Enter your details to join</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Room Name
                </label>
                <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="e.g. Team Alpha"
                required
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Your Name
                </label>
                <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="John Doe"
                required
                />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Choose Avatar
            </label>
            <div className="grid grid-cols-8 gap-2 p-2 bg-slate-950 rounded-lg border border-slate-700 max-h-28 overflow-y-auto scrollbar-hide">
            {AVATARS.map((avatar) => (
                <button
                key={avatar}
                type="button"
                onClick={() => setSelectedAvatar(avatar)}
                className={`
                    w-8 h-8 flex items-center justify-center rounded text-lg transition-transform hover:scale-110
                    ${selectedAvatar === avatar ? 'bg-indigo-600 ring-2 ring-indigo-400 scale-110' : 'hover:bg-slate-800'}
                `}
                >
                {avatar}
                </button>
            ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Select Role
            </label>
            <div className="grid grid-cols-1 gap-2">
            {ROLES.map((r) => (
                <div
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`
                    cursor-pointer p-3 rounded-lg border transition-all flex items-center justify-between
                    ${role === r.value 
                    ? 'bg-indigo-900/30 border-indigo-500 ring-1 ring-indigo-500/50' 
                    : 'bg-slate-950 border-slate-700 hover:border-slate-500 hover:bg-slate-900'
                    }
                `}
                >
                    <span className={`text-sm font-medium ${role === r.value ? 'text-white' : 'text-slate-400'}`}>
                    {r.label}
                    </span>
                    {role === r.value && (
                       <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                       </div>
                    )}
                </div>
            ))}
            </div>
          </div>

          <Button type="submit" className="w-full py-3 text-base shadow-lg shadow-indigo-500/20" size="lg">
            Join Session
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
