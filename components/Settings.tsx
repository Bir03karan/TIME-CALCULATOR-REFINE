
import React, { useRef, useState, useMemo } from 'react';
import { AppSettings } from '../types';

interface SettingsProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, setSettings, onBack }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEmojiModalOpen, setIsEmojiModalOpen] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');

  const emojiSections: Record<string, string[]> = {
    "Status": ['⚡', '💎', '🔥', '✨', '🌀', '🎯', '🧩', '🚀', '🌟', '💡', '🔋', '🏆'],
    "Persona": ['😎', '🤖', '👾', '👤', '👨‍💻', '👩‍💻', '🦸‍♂️', '🦸‍♀️', '🥷', '🧙‍♂️', '👽', '👻'],
    "Matrix": ['💼', '🎨', '💻', '⌚', '🧠', '👔', '🧪', '🔭', '🏹', '📚', '🔐', '📡'],
    "Nature": ['🌿', '🌵', '🌋', '🌊', '🌙', '☀️', '🐾', '🦋', '🍀', '🍁', '🪐', '🌲'],
    "Icons": ['❤️', '🌈', '🍭', '🍕', '☕', '⚽', '🎮', '🎸', '🎬', '🎭', '🎧', '📸']
  };

  const filteredEmojiSections: Record<string, string[]> = useMemo(() => {
    if (!emojiSearch) return emojiSections;
    const filtered: Record<string, string[]> = {};
    Object.entries(emojiSections).forEach(([title, list]) => {
      const matched = list.filter(e => e.includes(emojiSearch));
      if (matched.length > 0) filtered[title] = matched;
    });
    return filtered;
  }, [emojiSearch, emojiSections]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("Image too large. Please select a file under 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            avatarImage: reader.result as string,
            avatarEmoji: '🖼️' 
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearCustomAvatar = () => {
    setSettings(prev => {
      const newProfile = { ...prev.profile };
      delete newProfile.avatarImage;
      return { ...prev, profile: { ...newProfile, avatarEmoji: '⚡' } };
    });
  };

  const selectEmoji = (emoji: string) => {
    setSettings(prev => {
      const newProfile = { ...prev.profile };
      delete newProfile.avatarImage;
      return { ...prev, profile: { ...newProfile, avatarEmoji: emoji } };
    });
    setIsEmojiModalOpen(false);
  };

  const workdayOptions = [6, 7, 8, 9, 10];

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-[#0b0e14] transition-colors duration-500">
      <header className="sticky top-0 z-[60] bg-white/80 dark:bg-[#0b0e14]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800/50 px-6 py-4 flex items-center justify-between pt-[env(safe-area-inset-top,1rem)]">
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold tracking-tight text-[#111318] dark:text-white leading-none">Settings</h2>
          <span className="text-[9px] font-normal text-primary mt-0.5">Node configuration</span>
        </div>
        {/* Validate button removed for a cleaner experience */}
      </header>

      <div className="px-6 py-10 space-y-12 pb-56">
        <section className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800/50 flex flex-col items-center">
          <div className="flex flex-col items-center gap-6 mb-8 w-full">
            <div className="relative">
              <div className="size-24 bg-gray-50 dark:bg-black/40 rounded-3xl flex items-center justify-center text-5xl shadow-inner border border-gray-100 dark:border-white/5 overflow-hidden transition-all duration-500">
                {settings.profile.avatarImage ? (
                  <img src={settings.profile.avatarImage} alt="Avatar" className="size-full object-cover" />
                ) : (
                  <span className="animate-in fade-in zoom-in-50 duration-500 drop-shadow-lg">{settings.profile.avatarEmoji}</span>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-[10px] font-normal text-[#111318] dark:text-white border border-gray-100 dark:border-gray-700 active:scale-90 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">image</span>
                Asset
              </button>
              <button 
                onClick={() => setIsEmojiModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-[10px] font-normal active:scale-90 transition-all shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-[16px]">face</span>
                Glyph
              </button>
            </div>
            
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>

          <div className="w-full space-y-6">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-gray-500/60 dark:text-gray-400/60 tracking-tight ml-1 block text-left">Operator name</label>
              <input 
                type="text" 
                className="w-full h-12 bg-gray-50/50 dark:bg-black/30 border-none rounded-xl px-4 text-base font-normal focus:ring-[8px] focus:ring-primary/5 transition-all duration-500 dark:text-white placeholder:text-gray-300 tracking-tight" 
                value={settings.profile.name} 
                onChange={(e) => setSettings(prev => ({...prev, profile: {...prev.profile, name: e.target.value}}))} 
                placeholder="Identification" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-gray-500/60 dark:text-gray-400/60 tracking-tight ml-1 block text-left">Classification</label>
              <input 
                type="text" 
                className="w-full h-12 bg-gray-50/50 dark:bg-black/30 border-none rounded-xl px-4 text-base font-normal focus:ring-[8px] focus:ring-primary/5 transition-all duration-500 dark:text-white placeholder:text-gray-300 tracking-tight" 
                value={settings.profile.role} 
                onChange={(e) => setSettings(prev => ({...prev, profile: {...prev.profile, role: e.target.value}}))} 
                placeholder="Role" 
              />
            </div>

            {settings.profile.avatarImage && (
              <div className="pt-2 text-center">
                <button 
                  onClick={clearCustomAvatar}
                  className="inline-flex items-center gap-1.5 px-6 py-2 rounded-full text-[10px] font-normal text-red-500 bg-red-50 dark:bg-red-950/20 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                  Reset profile
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[13px] font-semibold text-gray-500/80 dark:text-gray-400 tracking-tight ml-1">System control</h3>
          <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800/50 shadow-sm divide-y divide-gray-50 dark:divide-gray-800/50">
            <div className="flex flex-col p-8 gap-6">
              <div className="flex items-center gap-6">
                <div className="size-11 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/5">
                  <span className="material-symbols-outlined text-[22px]">track_changes</span>
                </div>
                <span className="text-[12px] font-normal">Target cycle</span>
              </div>
              <div className="flex bg-gray-100/50 dark:bg-gray-800 p-1.5 rounded-2xl gap-2">
                {workdayOptions.map((hours) => {
                  const isActive = settings.defaultWorkDayMinutes === hours * 60;
                  return (
                    <button
                      key={hours}
                      onClick={() => setSettings(prev => ({ ...prev, defaultWorkDayMinutes: hours * 60 }))}
                      className={`flex-1 py-3.5 rounded-xl text-[12px] font-normal transition-all active:scale-95 ${
                        isActive 
                        ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                      }`}
                    >
                      {hours}h
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-8">
              <div className="flex items-center gap-6">
                <div className="size-11 rounded-2xl bg-orange-400/5 flex items-center justify-center text-orange-400 border border-orange-400/5">
                  <span className="material-symbols-outlined text-[22px]">database</span>
                </div>
                <span className="text-[12px] font-normal">Autosave protocol</span>
              </div>
              <button 
                onClick={() => setSettings(prev => ({...prev, autoSave: !prev.autoSave}))}
                className={`w-16 h-9 rounded-full transition-all duration-500 relative p-1.5 ${settings.autoSave ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-gray-200 dark:bg-gray-800'}`}
              >
                <div className={`size-6 bg-white rounded-full shadow-md transition-all duration-500 transform ${settings.autoSave ? 'translate-x-7' : 'translate-x-0'}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-8">
              <div className="flex items-center gap-6">
                <div className="size-11 rounded-2xl bg-purple-500/5 flex items-center justify-center text-purple-500 border border-purple-500/5">
                  <span className="material-symbols-outlined text-[22px]">contrast</span>
                </div>
                <span className="text-[12px] font-normal">Night vision</span>
              </div>
              <div className="flex bg-gray-100/50 dark:bg-gray-800 p-1 rounded-2xl w-40 relative border border-gray-100 dark:border-gray-700">
                 <div className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-white dark:bg-gray-700 rounded-xl shadow-md transition-all duration-500 ${settings.theme === 'dark' ? 'translate-x-[calc(100%+0.125rem)]' : 'translate-x-0'}`}></div>
                 <button onClick={() => setSettings(prev => ({...prev, theme: 'light'}))} className={`relative z-10 flex-1 py-2 text-[11px] font-normal transition-colors duration-500 ${settings.theme === 'light' ? 'text-primary' : 'text-gray-400'}`}>Off</button>
                 <button onClick={() => setSettings(prev => ({...prev, theme: 'dark'}))} className={`relative z-10 flex-1 py-2 text-[11px] font-normal transition-colors duration-500 ${settings.theme === 'dark' ? 'text-primary' : 'text-gray-400'}`}>On</button>
              </div>
            </div>
          </div>
        </section>

        <div className="text-center pt-12 opacity-10 pb-20">
             <p className="text-[10px] font-normal tracking-[0.2em]">Precise binary rev 4.5</p>
        </div>
      </div>

      {isEmojiModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#0b0e14] w-full max-w-[480px] rounded-t-[3rem] max-h-[70vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-full duration-500">
            <div className="w-full flex justify-center py-4">
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full" />
            </div>
            <div className="px-8 pb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold dark:text-white">Select Glyph</h3>
              <button onClick={() => setIsEmojiModalOpen(false)} className="size-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <div className="px-8 mb-4">
              <input 
                type="text" 
                placeholder="Search glyphs..." 
                className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-xl h-11 px-4 text-sm font-normal focus:ring-2 focus:ring-primary/5 transition-all"
                value={emojiSearch}
                onChange={e => setEmojiSearch(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto px-8 pb-12 space-y-8">
              {Object.entries(filteredEmojiSections).map(([section, emojis]) => (
                <div key={section} className="space-y-4">
                  <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{section}</h4>
                  <div className="grid grid-cols-6 gap-3">
                    {emojis.map(emoji => (
                      <button 
                        key={emoji} 
                        onClick={() => selectEmoji(emoji)}
                        className="aspect-square flex items-center justify-center text-2xl hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors active:scale-90"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
