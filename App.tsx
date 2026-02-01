
import React, { useState, useEffect, useCallback } from 'react';
import { AppSettings, TimeCalculation, UserProfile } from './types';
import Calculator from './components/Calculator';
import History from './components/History';
import Settings from './components/Settings';
import Report from './components/Report';

const STORAGE_KEY = 'precise-tracker-v4-settings';
const HISTORY_KEY = 'precise-tracker-v4-history';

const DEFAULT_SETTINGS: AppSettings = {
  defaultWorkDayMinutes: 8 * 60,
  autoSave: true,
  theme: 'light',
  isOnboarded: true,
  isAuthenticated: true,
  profile: {
    name: 'Operator',
    role: 'Precision Expert',
    avatarEmoji: '⚡'
  }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calc' | 'history' | 'report' | 'settings'>('calc');
  const [repeatData, setRepeatData] = useState<TimeCalculation | null>(null);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          profile: { ...DEFAULT_SETTINGS.profile, ...(parsed.profile || {}) },
          isAuthenticated: true,
          isOnboarded: true
        };
      }
    } catch (e) {
      console.error("Critical: Settings corruption detected. Falling back to defaults.", e);
    }
    return DEFAULT_SETTINGS;
  });

  const [history, setHistory] = useState<TimeCalculation[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  const addToHistory = useCallback((calc: TimeCalculation) => {
    setHistory(prev => [calc, ...prev]);
    setRepeatData(null);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const deleteHistoryItem = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  const deleteHistoryItems = useCallback((ids: string[]) => {
    setHistory(prev => prev.filter(item => !ids.includes(item.id)));
  }, []);

  const handleRepeat = useCallback((calc: TimeCalculation) => {
    setRepeatData(calc);
    setActiveTab('calc');
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'calc':
        return <Calculator settings={settings} setSettings={setSettings} onSave={addToHistory} repeatData={repeatData} onClearRepeat={() => setRepeatData(null)} />;
      case 'history':
        return <History history={history} settings={settings} onClear={clearHistory} onDelete={deleteHistoryItem} onDeleteMultiple={deleteHistoryItems} onBack={() => setActiveTab('calc')} onRepeat={handleRepeat} />;
      case 'report':
        return <Report history={history} settings={settings} onBack={() => setActiveTab('calc')} />;
      case 'settings':
        return <Settings settings={settings} setSettings={setSettings} onBack={() => setActiveTab('calc')} />;
      default:
        return <Calculator settings={settings} setSettings={setSettings} onSave={addToHistory} repeatData={repeatData} onClearRepeat={() => setRepeatData(null)} />;
    }
  };

  const navItems = [
    { id: 'calc', icon: 'terminal', activeIcon: 'terminal', label: 'Terminal' },
    { id: 'history', icon: 'history', activeIcon: 'history', label: 'Archive' },
    { id: 'report', icon: 'monitoring', activeIcon: 'monitoring', label: 'Report' },
    { id: 'settings', icon: 'tune', activeIcon: 'tune', label: 'Settings' },
  ];

  return (
    <div className="flex flex-col min-h-screen max-w-full sm:max-w-[480px] mx-auto bg-white dark:bg-[#0b0e14] relative transition-colors duration-500 overflow-hidden select-none">
      <div className="flex-1 pb-[calc(110px+env(safe-area-inset-bottom,0px))]">
        {renderContent()}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 sm:left-1/2 sm:-translate-x-1/2 w-full sm:w-[92%] max-w-[440px] z-[90] pb-[env(safe-area-inset-bottom,20px)] pt-2 px-5">
        <div className="bg-white/70 dark:bg-[#1a1c22]/85 backdrop-blur-3xl rounded-3xl p-2 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1),0_20px_60px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] flex items-center justify-between border border-white/60 dark:border-white/5 transition-all duration-500">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`relative flex flex-col items-center justify-center flex-1 h-14 transition-all duration-300 rounded-2xl touch-manipulation active:scale-[0.85] ${isActive ? 'scale-100' : 'opacity-40 grayscale-[0.3]'}`}
              >
                {isActive && (
                  <div className="absolute inset-1 bg-primary/5 dark:bg-primary/20 rounded-2xl border border-primary/10 animate-in fade-in zoom-in-95 duration-400"></div>
                )}
                
                <span 
                  className={`material-symbols-outlined text-[22px] transition-all duration-300 ${isActive ? 'text-primary scale-110' : 'text-gray-500 dark:text-gray-400'}`}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 400" }}
                >
                  {isActive ? item.activeIcon : item.icon}
                </span>
                
                <span className={`text-[8px] font-bold mt-0.5 tracking-tight transition-colors ${isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default App;
