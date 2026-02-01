
import React, { useState, useMemo } from 'react';
import { TimeCalculation, CalculatedDuration, AppSettings } from '../types';
import { formatMinutesToHM, formatMinutesToHHMM } from '../utils/timeUtils';

interface HistoryProps {
  history: TimeCalculation[];
  settings: AppSettings;
  onClear: () => void;
  onDelete: (id: string) => void;
  onDeleteMultiple: (ids: string[]) => void;
  onBack: () => void;
  onRepeat: (calc: TimeCalculation) => void;
}

type FilterPeriod = 'all' | 'today' | 'week' | 'month';

const History: React.FC<HistoryProps> = ({ history, settings, onClear, onDelete, onDeleteMultiple, onBack, onRepeat }) => {
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<FilterPeriod>('all');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingDetails, setViewingDetails] = useState<TimeCalculation | null>(null);

  const filteredHistory = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diff)).setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return history.filter(item => {
      const itemTime = new Date(item.date).getTime();
      let inPeriod = true;
      if (period === 'today') inPeriod = itemTime >= startOfToday;
      else if (period === 'week') inPeriod = itemTime >= startOfWeek;
      else if (period === 'month') inPeriod = itemTime >= startOfMonth;
      const matchesSearch = item.input.toLowerCase().includes(search.toLowerCase()) ||
                            new Date(item.date).toLocaleDateString().includes(search);
      return inPeriod && matchesSearch;
    });
  }, [history, search, period]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const IntervalRow: React.FC<{ d: CalculatedDuration; compact?: boolean }> = ({ d, compact = false }) => (
    <div className={`flex items-center justify-between p-4 rounded-2xl border border-gray-100/50 dark:border-gray-800/30 bg-gray-50/50 dark:bg-black/20 group hover:border-primary/20 transition-all`}>
      <div className="flex flex-col gap-0.5 max-w-[65%]">
        <span className="text-[10px] font-normal text-gray-400 leading-none truncate tabular-nums">{d.line}</span>
        <span className="text-xs font-normal text-[#111318] dark:text-white leading-tight truncate tracking-tight">{d.label}</span>
      </div>
      <div className="px-3 py-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 text-[11px] font-normal tabular-nums text-[#111318] dark:text-white">
        {formatMinutesToHHMM(d.minutes)}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-[#0b0e14] transition-colors duration-500">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0b0e14]/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800/50 px-5 py-4 flex items-center justify-between pt-[env(safe-area-inset-top,1rem)]">
        <div className="flex flex-col">
          <h2 className={`text-lg font-semibold tracking-tight leading-none transition-all duration-300 ${isSelectMode ? 'text-primary' : 'text-[#111318] dark:text-white'}`}>
            {isSelectMode ? `${selectedIds.size} marked` : 'Archive'}
          </h2>
          <span className="text-[9px] font-normal text-gray-400 mt-0.5">Persistence</span>
        </div>
        
        <div className="flex items-center gap-2">
          {!isSelectMode ? (
            <>
              <button onClick={() => setIsSelectMode(true)} className="size-11 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-400 active:scale-90 transition-all shadow-sm">
                <span className="material-symbols-outlined text-[22px]">checklist</span>
              </button>
              <button onClick={() => { if(window.confirm('Clear archive permanently?')) onClear(); }} className="size-11 rounded-2xl bg-red-50/50 dark:bg-red-900/10 flex items-center justify-center text-red-500 active:scale-90 transition-all border border-red-100/30">
                <span className="material-symbols-outlined text-[22px]">delete_sweep</span>
              </button>
            </>
          ) : (
            <button onClick={() => { setIsSelectMode(false); setSelectedIds(new Set()); }} className="px-5 py-2.5 rounded-2xl bg-primary text-white font-normal text-[11px] active:scale-95 transition-all shadow-lg shadow-primary/20">
              Exit
            </button>
          )}
        </div>
      </header>

      <div className="px-5 pt-8 pb-4 space-y-5">
        <div className="relative rounded-2xl overflow-hidden shadow-sm group">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-300 group-focus-within:text-primary transition-colors text-xl">search</span>
          <input 
            type="text" placeholder="Locate session record..." 
            className="w-full h-14 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl pl-14 pr-6 font-normal text-sm focus:ring-0 transition-all dark:text-white tracking-tight" 
            value={search} onChange={(e) => setSearch(e.target.value)} 
          />
        </div>

        <div className="flex p-1 bg-gray-100/50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
          {(['all', 'today', 'week', 'month'] as FilterPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2.5 rounded-xl text-[11px] font-normal transition-all active:scale-95 capitalize ${
                period === p 
                ? 'bg-white dark:bg-gray-800 text-primary shadow-sm border border-gray-100 dark:border-gray-700' 
                : 'text-gray-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-8 pb-32 pt-4">
        {filteredHistory.length === 0 ? (
          <div className="py-24 flex flex-col items-center text-center space-y-4 opacity-20">
            <span className="material-symbols-outlined text-6xl">folder_off</span>
            <p className="text-[11px] font-normal">Zero records found</p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div key={item.id} onClick={() => isSelectMode && toggleSelect(item.id)} className={`bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border transition-all duration-500 relative active:scale-[0.98] ${selectedIds.has(item.id) ? 'border-primary ring-[12px] ring-primary/5' : 'border-gray-100 dark:border-gray-800'}`}>
              <div className="flex justify-between items-start mb-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-normal text-gray-400 tabular-nums">
                    {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <h4 className="text-4xl font-normal tabular-nums text-primary tracking-tighter leading-none">
                    {formatMinutesToHM(item.totalMinutes)}
                  </h4>
                </div>
                {!isSelectMode && (
                  <div className="flex gap-2.5">
                    <button onClick={(e) => { e.stopPropagation(); onRepeat(item); }} className="size-11 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 active:scale-75 transition-all border border-gray-100 dark:border-gray-700 hover:text-primary">
                      <span className="material-symbols-outlined text-[20px]">refresh</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Destroy this record permanently?')) onDelete(item.id); }} className="size-11 rounded-2xl bg-red-50/50 dark:bg-red-900/10 flex items-center justify-center text-red-500 active:scale-75 transition-all hover:bg-red-500 hover:text-white">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {item.durations.slice(0, 2).map((d, iIdx) => <IntervalRow key={iIdx} d={d} />)}
                {item.durations.length > 2 && (
                  <button onClick={(e) => { e.stopPropagation(); setViewingDetails(item); }} className="w-full py-5 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800 text-[11px] font-normal text-gray-400 hover:text-primary hover:border-primary/20 active:bg-gray-50 transition-all">
                    Detail breakdown (+{item.durations.length - 2})
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isSelectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-[calc(90px+env(safe-area-inset-bottom,16px))] left-5 right-5 z-[100] animate-in slide-in-from-bottom-8 duration-500">
          <button onClick={() => { if(window.confirm(`Permanently destroy ${selectedIds.size} records?`)) onDeleteMultiple(Array.from(selectedIds)); }} className="w-full bg-red-500 text-white rounded-3xl font-normal text-[11px] shadow-2xl py-6 flex items-center justify-center gap-4 active:scale-95 transition-all">
            Purge {selectedIds.size} system node{selectedIds.size > 1 ? 's' : ''}
            <span className="material-symbols-outlined">delete_forever</span>
          </button>
        </div>
      )}

      {viewingDetails && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
           <div className="bg-white dark:bg-[#0b0e14] w-full max-w-[480px] rounded-t-[3.5rem] h-[88vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-full duration-700 overflow-hidden border-t border-white/10">
              <div className="w-full flex justify-center py-5 shrink-0">
                <div className="w-14 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full" />
              </div>
              <div className="px-8 pb-6 flex items-center justify-between shrink-0">
                <div className="space-y-1">
                  <h3 className="text-2xl font-normal tracking-tighter text-primary leading-none">Timeline</h3>
                  <p className="text-[10px] font-normal text-gray-400">Sequence extraction</p>
                </div>
                <button onClick={() => setViewingDetails(null)} className="size-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 active:scale-75 transition-all">
                  <span className="material-symbols-outlined text-[28px]">close</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-8 py-2 space-y-3 custom-scrollbar">
                 {viewingDetails.durations.map((d, idx) => <IntervalRow key={idx} d={d} compact />)}
              </div>
              <div className="p-10 bg-primary text-white pb-[calc(32px+env(safe-area-inset-bottom,0px))] shrink-0 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(19,91,236,0.2)]">
                 <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-normal text-white/50">Aggregate yield</span>
                      <p className="text-[9px] font-normal text-white/30">{viewingDetails.durations.length} segments logged</p>
                    </div>
                    <span className="text-5xl font-normal tabular-nums tracking-tighter">{formatMinutesToHM(viewingDetails.totalMinutes)}</span>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default History;
