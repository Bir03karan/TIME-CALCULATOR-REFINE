
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface AuthProps {
  onAuth: (profile: UserProfile) => void;
}

const LAST_EMAIL_KEY = 'precise-tracker-last-email';

const Auth: React.FC<AuthProps> = ({ onAuth }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: localStorage.getItem(LAST_EMAIL_KEY) || '',
    password: ''
  });

  const getUsers = () => {
    try {
      const saved = localStorage.getItem('precise-tracker-users');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  const saveUser = (user: any) => {
    const users = getUsers();
    users.push(user);
    localStorage.setItem('precise-tracker-users', JSON.stringify(users));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay for "Realism"
    setTimeout(() => {
      const users = getUsers();
      
      if (mode === 'signup') {
        const exists = users.find((u: any) => u.email === formData.email);
        if (exists) {
          setError('Email already registered.');
          setLoading(false);
          return;
        }
        
        const newUser = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role || 'Professional',
          avatarEmoji: '⚡'
        };
        saveUser(newUser);
        localStorage.setItem(LAST_EMAIL_KEY, formData.email);
        onAuth({
          name: newUser.name,
          role: newUser.role,
          avatarEmoji: newUser.avatarEmoji,
          email: newUser.email
        });
      } else {
        const user = users.find((u: any) => u.email === formData.email && u.password === formData.password);
        if (user) {
          localStorage.setItem(LAST_EMAIL_KEY, formData.email);
          onAuth({
            name: user.name,
            role: user.role,
            avatarEmoji: user.avatarEmoji,
            email: user.email
          });
        } else {
          setError('Invalid credentials. Double check encryption.');
        }
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#fdfdfe] dark:bg-[#0b0e14] flex flex-col p-8 overflow-y-auto">
      <div className="flex flex-col items-center mt-12 mb-12 animate-in fade-in zoom-in-95 duration-700">
        <div className="size-16 rounded-3xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/40 mb-6 relative">
          <span className="material-symbols-outlined text-3xl">hourglass_top</span>
          {loading && (
            <div className="absolute inset-0 border-2 border-white/20 border-t-white rounded-3xl animate-spin"></div>
          )}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#111318] dark:text-white text-center">
          {mode === 'signup' ? 'Enlist identity' : 'Secure access'}
        </h1>
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-2">Precision node</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-sm mx-auto w-full">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <span className="material-symbols-outlined text-red-500 text-lg">error</span>
            <span className="text-[11px] font-medium text-red-500 tracking-tight">Authentication failed: {error}</span>
          </div>
        )}

        {mode === 'signup' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-gray-400 tracking-tight ml-1 opacity-60">Callsign</label>
              <input 
                type="text" 
                required
                placeholder="Name"
                className="w-full h-12 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 font-medium text-sm focus:ring-4 focus:ring-primary/5 transition-all dark:text-white tracking-tight"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-gray-400 tracking-tight ml-1 opacity-60">Designation</label>
              <input 
                type="text" 
                required
                placeholder="Role"
                className="w-full h-12 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 font-medium text-sm focus:ring-4 focus:ring-primary/5 transition-all dark:text-white tracking-tight"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[11px] font-medium text-gray-400 tracking-tight ml-1 opacity-60">Access key</label>
          <input 
            type="email" 
            required
            placeholder="Email address"
            className="w-full h-14 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 font-medium text-base focus:ring-4 focus:ring-primary/5 transition-all dark:text-white tracking-tight"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-medium text-gray-400 tracking-tight ml-1 opacity-60">Encryption</label>
          <input 
            type="password" 
            required
            placeholder="System password"
            className="w-full h-14 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 font-medium text-base focus:ring-4 focus:ring-primary/5 transition-all dark:text-white tracking-tight"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className={`w-full h-16 bg-primary text-white rounded-[2rem] font-medium text-[11px] tracking-widest uppercase shadow-2xl shadow-primary/20 active:scale-95 transition-all mt-4 flex items-center justify-center gap-3 ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? 'Validating...' : mode === 'signup' ? 'Initiate session' : 'Verify credentials'}
          {!loading && <span className="material-symbols-outlined text-sm">login</span>}
        </button>
      </form>

      <div className="mt-12 text-center pb-12">
        <p className="text-[11px] font-medium text-gray-400 tracking-wide">
          {mode === 'signup' ? 'Existing operator?' : "New entity?"}
          <button 
            onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
            className="ml-3 text-primary hover:underline"
          >
            {mode === 'signup' ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
