
import React, { useMemo, useRef, useState } from 'react';
import { TimeCalculation, AppSettings } from '../types';
import { formatMinutesToHM, parseToMinutes } from '../utils/timeUtils';

interface ReportProps {
  history: TimeCalculation[];
  settings: AppSettings;
  onBack: () => void;
}

const Report: React.FC<ReportProps> = ({ history, settings, onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');

  const stats = useMemo(() => {
    const totalMinutes = history.reduce((sum, item) => sum + item.totalMinutes, 0);
    const avgMinutes = history.length > 0 ? totalMinutes / history.length : 0;
    
    let maxSession = 0;
    const categoryMinutes: Record<string, number> = {};
    
    history.forEach(item => {
      if (item.totalMinutes > maxSession) maxSession = item.totalMinutes;
      item.durations.forEach(d => {
        const cat = d.label.split(' ')[0] || 'Unlabeled';
        categoryMinutes[cat] = (categoryMinutes[cat] || 0) + d.minutes;
      });
    });

    const topCategory = Object.entries(categoryMinutes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      total: formatMinutesToHM(totalMinutes),
      avg: formatMinutesToHM(avgMinutes),
      count: history.length,
      maxSession: formatMinutesToHM(maxSession),
      topCategory
    };
  }, [history]);

  // Chart data for last 7 days
  const weeklyData = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const total = history
        .filter(item => new Date(item.date).toDateString() === d.toDateString())
        .reduce((sum, item) => sum + item.totalMinutes, 0);
      days.push({ label: dateStr, value: total });
    }
    const maxVal = Math.max(...days.map(d => d.value), 60); // min height for scale
    return days.map(d => ({ ...d, height: (d.value / maxVal) * 100 }));
  }, [history]);

  const distributionData = useMemo(() => {
    let morning = 0, afternoon = 0, evening = 0;
    history.forEach(calc => {
      calc.durations.forEach(d => {
        const startStr = d.line.split('-')[0].trim();
        const startMins = parseToMinutes(startStr);
        if (startMins !== null) {
          if (startMins >= 300 && startMins < 720) morning += d.minutes;
          else if (startMins >= 720 && startMins < 1080) afternoon += d.minutes;
          else evening += d.minutes;
        }
      });
    });
    const total = morning + afternoon + evening || 1;
    return [
      { label: 'Morning', value: morning, color: 'bg-amber-400', icon: 'light_mode', percent: (morning / total) * 100 },
      { label: 'Afternoon', value: afternoon, color: 'bg-primary', icon: 'wb_sunny', percent: (afternoon / total) * 100 },
      { label: 'Evening', value: evening, color: 'bg-indigo-500', icon: 'dark_mode', percent: (evening / total) * 100 },
    ];
  }, [history]);

  const handleExportPDF = async () => {
    if (!reportRef.current || isExporting) return;
    setIsExporting(true);
    setExportStatus('Rendering...');
    
    try {
      // Small delay to let UI settle
      await new Promise(r => setTimeout(r, 100));

      const canvas = await (window as any).html2canvas(reportRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: settings.theme === 'dark' ? '#0b0e14' : '#fcfcfd',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = (window as any).jspdf;
      
      // Calculate dimensions to fit image to A4
      const imgWidth = 595.28; // A4 width in pts
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? 'p' : 'l',
        unit: 'pt',
        format: [imgWidth, imgHeight]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      pdf.save(`Precision_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      
      setExportStatus('Success!');
      setTimeout(() => setExportStatus(''), 2000);
    } catch (e) {
      console.error('Export failed:', e);
      setExportStatus('Failed');
      setTimeout(() => setExportStatus(''), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-[#0b0e14] transition-colors duration-500">
      {exportStatus && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-4">
            <span className={`material-symbols-outlined ${exportStatus === 'Success!' ? 'text-emerald-500' : 'text-primary animate-spin'}`}>
              {exportStatus === 'Success!' ? 'verified' : 'sync'}
            </span>
            <span className="text-sm font-normal dark:text-white">{exportStatus}</span>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-[100] bg-white/80 dark:bg-[#0b0e14]/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800/50 px-5 py-4 flex items-center justify-between pt-[env(safe-area-inset-top,1rem)]">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="size-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 active:scale-90 transition-all border border-gray-100 dark:border-gray-800">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold tracking-tight dark:text-white leading-none">Analytics</h2>
            <span className="text-[9px] font-normal text-primary mt-0.5">Performance index</span>
          </div>
        </div>
        
        <button 
          onClick={handleExportPDF} 
          disabled={isExporting || history.length === 0}
          className="bg-primary hover:bg-primary/90 text-white h-10 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale shrink-0"
        >
          <span className="material-symbols-outlined text-lg">{isExporting ? 'sync' : 'picture_as_pdf'}</span>
          <span className="text-[11px] font-normal hidden sm:inline">Export PDF</span>
        </button>
      </header>

      <div className="px-5 py-6 space-y-10 pb-24">
        <div ref={reportRef} className="space-y-10 p-2">
          {/* Header Card */}
          <section className="bg-primary p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute -right-20 -top-20 size-60 bg-white/10 rounded-full blur-[80px]"></div>
            
            <div className="flex items-center gap-4 mb-10 relative z-10">
              <div className="size-14 rounded-2xl bg-white/15 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-2xl overflow-hidden shadow-xl shrink-0">
                {settings.profile.avatarImage ? (
                  <img src={settings.profile.avatarImage} alt="Avatar" className="size-full object-cover" />
                ) : (
                  settings.profile.avatarEmoji
                )}
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-[9px] font-normal opacity-60">Identity verified</p>
                <h3 className="text-lg font-normal tracking-tight truncate uppercase leading-none">{settings.profile.name}</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-10">
              <div className="space-y-1">
                <p className="text-[9px] font-normal opacity-50">Grand total</p>
                <h3 className="text-4xl font-normal tabular-nums tracking-tighter leading-none">{stats.total}</h3>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-normal opacity-50">Top category</p>
                <h3 className="text-xl font-normal tracking-tight truncate">{stats.topCategory}</h3>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6 pt-8 mt-8 border-t border-white/10">
              <div className="space-y-1">
                <p className="text-[8px] font-normal opacity-60">Avg shift</p>
                <p className="text-lg font-normal tabular-nums">{stats.avg}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-normal opacity-60">Max session</p>
                <p className="text-lg font-normal tabular-nums">{stats.maxSession}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-normal opacity-60">Cycles</p>
                <p className="text-lg font-normal tabular-nums">{stats.count}</p>
              </div>
            </div>
          </section>

          {/* Weekly Velocity Chart */}
          <section className="space-y-4">
            <h3 className="text-[13px] font-semibold text-gray-500/80 dark:text-gray-400 tracking-tight ml-1">Weekly velocity</h3>
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex items-end justify-between h-40 gap-2 px-1">
                {weeklyData.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end group">
                    <div className="relative w-full flex flex-col items-center justify-end h-full">
                       {day.value > 0 && (
                        <div className="absolute -top-6 text-[8px] font-normal text-primary tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatMinutesToHM(day.value)}
                        </div>
                       )}
                       <div 
                        style={{ height: `${Math.max(day.height, 4)}%` }} 
                        className={`w-full max-w-[20px] rounded-full transition-all duration-1000 ${day.value > 0 ? 'bg-primary/80 group-hover:bg-primary' : 'bg-gray-100 dark:bg-gray-800'}`}
                      />
                    </div>
                    <span className="text-[9px] font-normal text-gray-400 whitespace-nowrap">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Distribution Section */}
          <section className="space-y-4">
            <h3 className="text-[13px] font-semibold text-gray-500/80 dark:text-gray-400 tracking-tight ml-1">Focus distribution</h3>
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 space-y-8 shadow-sm">
              <div className="flex h-3 w-full bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-100 dark:border-white/5">
                {distributionData.map((t, i) => <div key={i} style={{ width: `${t.percent}%` }} className={`${t.color} h-full transition-all duration-1000`} />)}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {distributionData.map((t, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-transparent transition-all">
                      <div className={`size-8 rounded-lg ${t.color} flex items-center justify-center text-white shadow-sm shrink-0`}>
                        <span className="material-symbols-outlined text-lg">{t.icon}</span>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-normal text-gray-400 leading-none mb-1">{t.label}</p>
                        <p className="text-sm font-normal text-[#111318] dark:text-white tabular-nums leading-none">{Math.round(t.percent)}%</p>
                      </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Activity List */}
          <section className="space-y-4">
            <h3 className="text-[13px] font-semibold text-gray-500/80 dark:text-gray-400 tracking-tight ml-1">Recent activity</h3>
            <div className="space-y-3">
              {history.slice(0, 5).map((item) => (
                <div key={item.id} className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all">
                  <div className="flex flex-col space-y-1">
                    <span className="text-[9px] font-normal text-primary">
                      {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })}
                    </span>
                    <span className="text-sm font-normal text-[#111318] dark:text-white tracking-tight truncate max-w-[150px]">
                      {item.durations.length} focus sessions
                    </span>
                  </div>
                  <div className="px-4 py-3 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <span className="text-lg font-normal text-primary tabular-nums tracking-tighter leading-none">{formatMinutesToHM(item.totalMinutes)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Report;
