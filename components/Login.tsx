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
      avatar: selectedAvatar
    };
    onJoin(newUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-6 md:p-8 my-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            HighWind's Scrum Poker
          </h1>
          <p className="text-slate-400 mt-2">Real-time estimation with AI powers</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Choose Avatar
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-2 bg-slate-900 rounded-lg border border-slate-700 max-h-48 overflow-y-auto scrollbar-hide">
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
            <div className="grid grid-cols-1 gap-3">
              {ROLES.map((r) => (
                <div
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`
                    cursor-pointer p-3 rounded-lg border transition-all
                    ${role === r.value 
                      ? 'bg-indigo-900/40 border-indigo-500 ring-1 ring-indigo-500' 
                      : 'bg-slate-900 border-slate-700 hover:bg-slate-800'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${role === r.value ? 'text-indigo-300' : 'text-slate-300'}`}>
                      {r.label}
                    </span>
                    {role === r.value && (
                      <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{r.description}</p>
                </div>
              ))}
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