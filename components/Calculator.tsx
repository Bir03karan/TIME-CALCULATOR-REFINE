
import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AppSettings, TimeCalculation, CalculatedDuration } from '../types';
import { 
  calculateLineDurations, 
  parseTimeRangeDetailed,
  formatMinutesToHM,
  formatMinutesToHHMM
} from '../utils/timeUtils';

interface StructuredEntry {
  id: string;
  start: string;
  end: string;
  note: string;
  date: string;
}

interface CalculatorProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onSave: (calc: TimeCalculation) => void;
  repeatData?: TimeCalculation | null;
  onClearRepeat?: () => void;
}

const BULK_DRAFT_KEY = 'precise-tracker-bulk-draft';
const BUILDER_DRAFT_KEY = 'precise-tracker-builder-draft';

const Calculator: React.FC<CalculatorProps> = ({ settings, setSettings, onSave, repeatData, onClearRepeat }) => {
  const [activeInputTab, setActiveInputTab] = useState<'bulk' | 'builder'>('bulk');
  const [bulkInput, setBulkInput] = useState(() => localStorage.getItem(BULK_DRAFT_KEY) || '');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [structuredEntries, setStructuredEntries] = useState<StructuredEntry[]>(() => {
    const saved = localStorage.getItem(BUILDER_DRAFT_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [{ 
      id: '1', 
      start: '', 
      end: '', 
      note: '', 
      date: new Date().toISOString().split('T')[0] 
    }];
  });
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (repeatData) {
      const input = repeatData.input;
      const bulkPart = input.match(/Bulk: ([\s\S]*?)(?:\nBuilder:|$)/);
      const builderPart = input.match(/Builder: ([\s\S]*)$/);
      if (bulkPart && bulkPart[1]) setBulkInput(bulkPart[1].trim());
      if (builderPart && builderPart[1]) {
        try {
          setStructuredEntries(JSON.parse(builderPart[1]));
          setActiveInputTab('builder');
        } catch (e) { console.error(e); }
      }
    }
  }, [repeatData]);

  useEffect(() => { localStorage.setItem(BULK_DRAFT_KEY, bulkInput); }, [bulkInput]);
  useEffect(() => { localStorage.setItem(BUILDER_DRAFT_KEY, JSON.stringify(structuredEntries)); }, [structuredEntries]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const results = useMemo(() => {
    const rawBulkDurs = calculateLineDurations(bulkInput);
    const rawBuilderDurs = structuredEntries.map(entry => {
      if (!entry.start && !entry.end) return null;
      const { minutes, error } = parseTimeRangeDetailed(`${entry.start}-${entry.end}`);
      return {
        line: `${entry.start}-${entry.end}`,
        minutes: minutes || 0,
        label: entry.note || 'Focus session',
        date: entry.date,
        error: error && (entry.start || entry.end) ? error : undefined
      };
    }).filter(d => d !== null) as CalculatedDuration[];

    const durations = [...rawBulkDurs, ...rawBuilderDurs];
    const totalMinutes = durations.reduce((acc, curr) => acc + (curr.error ? 0 : curr.minutes), 0);
    return { durations, totalMinutes, hasErrors: durations.some(d => d.error) };
  }, [bulkInput, structuredEntries]);

  const handleAiRefinement = async () => {
    if (!bulkInput.trim() || isAiProcessing) return;
    setIsAiProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Convert this messy work log into a clean list of time ranges and project tags. 
        Format each line strictly as: "HH:MM - HH:MM Project Name". 
        If specific times are missing but durations are mentioned (e.g., "3 hours starting at 9"), calculate the range.
        Log text: "${bulkInput}"`,
        config: { responseMimeType: 'text/plain' },
      });
      if (response.text) setBulkInput(response.text.trim());
    } catch (error) {
      console.error('AI Refinement failed:', error);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleClear = () => {
    setBulkInput('');
    setStructuredEntries([{ 
      id: Date.now().toString(), 
      start: '', 
      end: '', 
      note: '', 
      date: new Date().toISOString().split('T')[0] 
    }]);
    localStorage.removeItem(BULK_DRAFT_KEY);
    localStorage.removeItem(BUILDER_DRAFT_KEY);
  };

  const handleAddEntry = () => {
    const lastEntry = structuredEntries[structuredEntries.length - 1];
    const nextDate = lastEntry ? lastEntry.date : new Date().toISOString().split('T')[0];
    setStructuredEntries([
      ...structuredEntries, 
      { id: Date.now().toString(), start: '', end: '', note: '', date: nextDate }
    ]);
  };

  const handleCalculate = () => {
    if (results.totalMinutes === 0 || results.hasErrors) return;
    onSave({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      input: `Bulk: ${bulkInput}\nBuilder: ${JSON.stringify(structuredEntries)}`,
      durations: results.durations,
      totalMinutes: results.totalMinutes
    });
    setBulkInput('');
    setStructuredEntries([{ 
      id: Date.now().toString(), 
      start: '', 
      end: '', 
      note: '', 
      date: new Date().toISOString().split('T')[0] 
    }]);
    localStorage.removeItem(BULK_DRAFT_KEY);
    localStorage.removeItem(BUILDER_DRAFT_KEY);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const hasData = results.totalMinutes > 0 || results.hasErrors;

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-[#0b0e14] transition-colors duration-500">
      {showSuccess && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-emerald-500 text-white px-6 py-3.5 rounded-full font-normal text-[11px] shadow-2xl animate-in fade-in zoom-in slide-in-from-top-4 duration-500 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">verified</span>
          Sync successful
        </div>
      )}

      <header className="sticky top-0 z-[60] bg-white/80 dark:bg-[#0b0e14]/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800/50 px-5 py-4 flex items-center justify-between pt-[env(safe-area-inset-top,1rem)] transition-all">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center text-xl shadow-inner border border-primary/10 overflow-hidden shrink-0">
            {settings.profile.avatarImage ? (
              <img src={settings.profile.avatarImage} alt="Avatar" className="size-full object-cover" />
            ) : (
              settings.profile.avatarEmoji
            )}
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-[#111318] dark:text-white tracking-tight leading-none">Precise</h1>
            <span className="text-[9px] font-normal text-primary mt-0.5">v4.5 terminal</span>
          </div>
        </div>
        
        <div className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-[11px] font-normal tabular-nums text-[#111318] dark:text-gray-400">
           {currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
        </div>
      </header>

      <main className="px-5 py-8 space-y-10 flex-1 pb-24">
        <section className="flex p-1 bg-gray-100/50 dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-white/5">
          <button 
            onClick={() => setActiveInputTab('bulk')} 
            className={`flex-1 py-3 rounded-xl text-[11px] font-normal transition-all touch-manipulation active:scale-95 ${activeInputTab === 'bulk' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm border border-gray-100 dark:border-gray-700' : 'text-gray-400'}`}
          >
            Bulk
          </button>
          <button 
            onClick={() => setActiveInputTab('builder')} 
            className={`flex-1 py-3 rounded-xl text-[11px] font-normal transition-all touch-manipulation active:scale-95 ${activeInputTab === 'builder' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm border border-gray-100 dark:border-gray-700' : 'text-gray-400'}`}
          >
            Builder
          </button>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[13px] font-semibold text-gray-500/80 dark:text-gray-400 tracking-tight ml-1">Data stream</h3>
            <div className="flex gap-5">
               {activeInputTab === 'bulk' && bulkInput.trim().length > 10 && (
                 <button onClick={handleAiRefinement} disabled={isAiProcessing} className="text-[11px] font-normal text-primary py-1 flex items-center gap-1.5 active:scale-90 transition-all">
                   <span className={`material-symbols-outlined text-[16px] ${isAiProcessing ? 'animate-spin' : ''}`}>magic_button</span>
                   Refine
                 </button>
               )}
               <button onClick={handleClear} className="text-[11px] font-normal text-gray-400 hover:text-red-500 py-1 transition-colors active:scale-90">Flush</button>
            </div>
          </div>
          
          {activeInputTab === 'bulk' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 focus-within:ring-[12px] focus-within:ring-primary/5 focus-within:border-primary/20 transition-all duration-500">
                <textarea
                  className="w-full resize-none rounded-3xl text-[#111318] dark:text-white focus:outline-none border-none bg-transparent min-h-[240px] p-8 text-xl font-normal leading-relaxed tracking-tight placeholder:text-gray-200 dark:placeholder:text-gray-800"
                  placeholder="09:00 - 18:00 Project Infinity..."
                  value={bulkInput}
                  spellCheck="false"
                  onChange={(e) => setBulkInput(e.target.value)}
                />
              </div>
              
              {results.durations.length > 0 && results.durations.some(d => d.line.trim().length > 0) && (
                <div className="space-y-3 px-1">
                   {results.durations.map((d, i) => (
                     <div key={i} className={`flex items-center justify-between py-4 px-6 rounded-2xl border transition-all duration-300 ${d.error ? 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-white dark:bg-gray-900/40 border-gray-100 dark:border-gray-800'}`}>
                        <span className="text-[11px] font-normal text-gray-400 tabular-nums">{d.line}</span>
                        {!d.error && (
                          <span className="text-xs font-normal text-primary tabular-nums">{formatMinutesToHHMM(d.minutes)}</span>
                        )}
                        {d.error && <span className="text-[10px] font-normal text-red-500">Error</span>}
                     </div>
                   ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {structuredEntries.map((entry) => {
                const { minutes, error } = parseTimeRangeDetailed(`${entry.start}-${entry.end}`);
                const isValid = minutes !== null && !error;
                
                return (
                  <div key={entry.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm transition-all duration-500 hover:border-primary/10">
                     <div className="flex items-center justify-between mb-4 px-2">
                        <input 
                          type="date"
                          className="bg-transparent border-none p-0 text-[11px] font-normal text-primary focus:ring-0 cursor-pointer tracking-tight"
                          value={entry.date}
                          onChange={(e) => setStructuredEntries(prev => prev.map(s => s.id === entry.id ? {...s, date: e.target.value} : s))}
                        />
                        {structuredEntries.length > 1 && (
                          <button onClick={() => setStructuredEntries(prev => prev.filter(s => s.id !== entry.id))} className="text-red-500/50 hover:text-red-500 active:scale-75 transition-all">
                            <span className="material-symbols-outlined text-[20px]">close_small</span>
                          </button>
                        )}
                     </div>

                     <div className="flex items-center gap-3 mb-4">
                       <div className="flex-1 flex items-center bg-gray-50 dark:bg-black/30 rounded-2xl px-2 border border-transparent focus-within:border-primary/20 transition-all duration-300">
                         <input 
                           type="text" placeholder="Start" 
                           className="w-full bg-transparent border-none py-4 font-normal text-xl text-center focus:ring-0 placeholder:text-gray-300 dark:text-white tabular-nums" 
                           value={entry.start} 
                           onChange={(e) => setStructuredEntries(prev => prev.map(s => s.id === entry.id ? {...s, start: e.target.value} : s))} 
                         />
                         <div className="w-[1.5px] h-8 bg-gray-200 dark:bg-gray-800/50 shrink-0"></div>
                         <input 
                           type="text" placeholder="End" 
                           className="w-full bg-transparent border-none py-4 font-normal text-xl text-center focus:ring-0 placeholder:text-gray-300 dark:text-white tabular-nums" 
                           value={entry.end} 
                           onChange={(e) => setStructuredEntries(prev => prev.map(s => s.id === entry.id ? {...s, end: e.target.value} : s))} 
                         />
                       </div>
                       {isValid && (
                        <div className="bg-primary text-white px-4 py-4 rounded-2xl text-[11px] font-normal tabular-nums shrink-0 min-w-[64px] text-center shadow-lg shadow-primary/20 animate-in zoom-in-90">
                          {formatMinutesToHM(minutes)}
                        </div>
                       )}
                     </div>

                     <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-300 dark:text-gray-700 text-[20px]">tag</span>
                        <input 
                          type="text" placeholder="Project identifier..." 
                          className="w-full bg-gray-50/50 dark:bg-black/10 border-none rounded-2xl h-14 pl-12 pr-6 text-[12px] font-normal focus:ring-2 focus:ring-primary/5 transition-all dark:text-white placeholder:text-gray-300" 
                          value={entry.note} 
                          onChange={(e) => setStructuredEntries(prev => prev.map(s => s.id === entry.id ? {...s, note: e.target.value} : s))} 
                        />
                     </div>
                  </div>
                );
              })}
              
              <button 
                onClick={handleAddEntry} 
                className="w-full py-6 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl flex items-center justify-center gap-3 text-gray-300 dark:text-gray-700 font-normal text-[11px] active:scale-[0.98] transition-all hover:border-primary/20 hover:text-primary/40"
              >
                <span className="material-symbols-outlined text-[24px]">add_circle</span>
                Inject node
              </button>
            </div>
          )}
        </section>
      </main>

      {hasData && (
        <div className="fixed bottom-[calc(90px+env(safe-area-inset-bottom,16px))] left-0 right-0 z-[100] px-5 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-[480px] animate-in slide-in-from-bottom-12 duration-700">
           <div className={`p-3 pl-8 rounded-3xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] flex items-center justify-between border transition-all duration-700 backdrop-blur-3xl ${
             settings.theme === 'dark' 
              ? 'bg-[#1a1c22]/95 border-white/10 shadow-black/90' 
              : 'bg-white/95 border-gray-200 shadow-primary/20'
           }`}>
              <div className="space-y-0.5">
                 <span className={`text-[10px] font-normal block leading-none ${settings.theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Net accumulation</span>
                 <div className="flex items-baseline gap-2">
                   <span className={`text-4xl font-normal tabular-nums tracking-tighter leading-none ${settings.theme === 'dark' ? 'text-white' : 'text-[#111318]'}`}>
                     {formatMinutesToHM(results.totalMinutes)}
                   </span>
                   {results.hasErrors && (
                     <span className="text-[10px] font-normal text-red-500 animate-pulse">Parser collision</span>
                   )}
                 </div>
              </div>
              <button 
                 onClick={handleCalculate}
                 disabled={results.totalMinutes === 0 || results.hasErrors}
                 className={`size-16 rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-all ${
                   results.hasErrors 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' 
                    : 'bg-primary text-white shadow-primary/40'
                 }`}
              >
                 <span className="material-symbols-outlined text-[32px] font-normal">send_and_archive</span>
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Calculator;
