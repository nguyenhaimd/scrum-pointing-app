
import React, { useState } from 'react';
import { ROLES, AVATARS, CARD_THEMES } from '../constants';
import { UserRole, User } from '../types';
import Button from './Button';
import Card from './Card';

interface LoginProps {
  onJoin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onJoin }) => {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('planning');
  const [role, setRole] = useState<UserRole>(UserRole.DEVELOPER);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [selectedTheme, setSelectedTheme] = useState(CARD_THEMES[0].id);

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
      cardTheme: selectedTheme,
      deviceType: getDeviceType()
    };
    onJoin(newUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-6 md:p-8 my-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            HighWind's Scrum Poker
          </h1>
          <p className="text-slate-400 mt-2">Customize your style & join the session</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                Room Name
                </label>
                <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="e.g. Team Alpha"
                required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                Your Name
                </label>
                <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="John Doe"
                required
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Avatar & Role */}
              <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                    Choose Avatar
                    </label>
                    <div className="grid grid-cols-5 gap-2 p-2 bg-slate-900 rounded-lg border border-slate-700 max-h-32 overflow-y-auto scrollbar-hide">
                    {AVATARS.map((avatar) => (
                        <button
                        key={avatar}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`
                            w-8 h-8 flex items-center justify-center rounded text-xl transition-transform hover:scale-110
                            ${selectedAvatar === avatar ? 'bg-indigo-600 ring-2 ring-indigo-400 scale-110' : 'hover:bg-slate-800'}
                        `}
                        >
                        {avatar}
                        </button>
                    ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select Role
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                    {ROLES.map((r) => (
                        <div
                        key={r.value}
                        onClick={() => setRole(r.value)}
                        className={`
                            cursor-pointer p-2.5 rounded-lg border transition-all
                            ${role === r.value 
                            ? 'bg-indigo-900/40 border-indigo-500 ring-1 ring-indigo-500' 
                            : 'bg-slate-900 border-slate-700 hover:bg-slate-800'
                            }
                        `}
                        >
                        <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${role === r.value ? 'text-indigo-300' : 'text-slate-300'}`}>
                            {r.label}
                            </span>
                            {role === r.value && (
                            <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
                            )}
                        </div>
                        </div>
                    ))}
                    </div>
                </div>
              </div>

              {/* Right Column: Card Theme */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Pick Your Card Style
                </label>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 h-[300px] overflow-y-auto scrollbar-hide">
                    <div className="grid grid-cols-2 gap-3">
                        {CARD_THEMES.map(theme => (
                            <div 
                                key={theme.id}
                                onClick={() => setSelectedTheme(theme.id)}
                                className={`
                                    flex flex-col items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all
                                    ${selectedTheme === theme.id ? 'bg-slate-800 border-indigo-500 ring-1 ring-indigo-500' : 'border-transparent hover:bg-slate-800'}
                                `}
                            >
                                <div className="pointer-events-none transform scale-75 origin-center">
                                    <Card value="8" theme={theme.id} size="sm" faceDown={true} />
                                </div>
                                <span className={`text-xs font-medium text-center ${selectedTheme === theme.id ? 'text-indigo-300' : 'text-slate-400'}`}>
                                    {theme.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
          </div>

          <Button type="submit" className="w-full" size="lg">
            Join Session
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;