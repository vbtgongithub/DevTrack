import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Activity, Clock, Target, ChevronDown, BarChart2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGamificationStore } from '../../store/gamificationStore';
import { ConfirmationModal } from '../ui/ConfirmationModal';

// Web Audio API Synthesizer for high-fidelity notification sound
const playFocusChime = () => {
  try {
     
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Note 1: E5
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.frequency.value = 659.25; // E5
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.08);
    gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
    
    // Note 2: A5
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 880.00; // A5
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.18);
    gain2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.26);
    gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.0);
    
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 1.5);
    osc2.start(ctx.currentTime + 0.18);
    osc2.stop(ctx.currentTime + 2.0);
  } catch (e) {
    console.error('Audio synthesizer error:', e);
  }
};

const SESSION_MODES = [
  { id: 'deep_work', label: 'Deep Work', color: 'text-violet-600', bg: 'bg-violet-500', hoverBg: 'hover:bg-violet-600', stroke: '#8b5cf6', dur: 90 },
  { id: 'backend', label: 'Backend Build', color: 'text-blue-600', bg: 'bg-blue-500', hoverBg: 'hover:bg-blue-600', stroke: '#3b82f6', dur: 50 },
  { id: 'dsa', label: 'DSA Sprint', color: 'text-emerald-600', bg: 'bg-emerald-500', hoverBg: 'hover:bg-emerald-600', stroke: '#10b981', dur: 45 },
  { id: 'debug', label: 'Debugging', color: 'text-amber-600', bg: 'bg-amber-500', hoverBg: 'hover:bg-amber-600', stroke: '#f59e0b', dur: 25 },
  { id: 'learn', label: 'Learning', color: 'text-rose-600', bg: 'bg-rose-500', hoverBg: 'hover:bg-rose-600', stroke: '#f43f5e', dur: 60 },
  { id: 'arch', label: 'Architecture', color: 'text-cyan-600', bg: 'bg-cyan-500', hoverBg: 'hover:bg-cyan-600', stroke: '#06b6d4', dur: 120 },
];

export const PomodoroTimer = () => {
  const [activeMode, setActiveMode] = useState(SESSION_MODES[0]);
  const [selectedDuration, setSelectedDuration] = useState<number>(SESSION_MODES[0].dur);
  const [timeLeft, setTimeLeft] = useState<number>(SESSION_MODES[0].dur * 60);
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'finished'>('idle');
  const [streak, setStreak] = useState<number>(() => Number(localStorage.getItem('devtrack_focus_streak') || '0'));
  const [completedSessions, setCompletedSessions] = useState<number>(() => Number(localStorage.getItem('devtrack_completed_sessions') || '0'));

  const { liveXp, setLiveXp, setPendingXpGain } = useGamificationStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [modeConfirmOpen, setModeConfirmOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<typeof SESSION_MODES[0] | null>(null);

  useEffect(() => {
    if (status === 'idle') {
      setTimeLeft(selectedDuration * 60);
    }
  }, [selectedDuration, status]);

  useEffect(() => {
    const handleStartFocus = () => {
      const focusSection = document.getElementById('focus-engine-section');
      if (focusSection) focusSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setStatus('running');
    };
    window.addEventListener('start-focus-session', handleStartFocus);
    return () => window.removeEventListener('start-focus-session', handleStartFocus);
  }, []);

  const handleFinished = () => {
    setStatus('finished');
    playFocusChime();
    const newSessions = completedSessions + 1;
    const newStreak = streak + 1;
    setCompletedSessions(newSessions);
    setStreak(newStreak);
    localStorage.setItem('devtrack_completed_sessions', String(newSessions));
    localStorage.setItem('devtrack_focus_streak', String(newStreak));
    const currentXpVal = liveXp !== null ? liveXp : 0;
    setLiveXp(currentXpVal + 50);
    setPendingXpGain(50);
    setTimeout(() => setPendingXpGain(null), 4000);
  };

  useEffect(() => {
    if (status === 'running') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleFinished();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleStartPause = () => setStatus(status === 'running' ? 'paused' : 'running');
  const handleReset = () => { setStatus('idle'); setTimeLeft(selectedDuration * 60); };

  const selectMode = (mode: typeof SESSION_MODES[0]) => {
    if (status === 'idle') {
      setActiveMode(mode);
      setSelectedDuration(mode.dur);
      setStatus('idle');
      setTimeLeft(mode.dur * 60);
    } else {
      setPendingMode(mode);
      setModeConfirmOpen(true);
    }
  };

  const handleConfirmModeChange = () => {
    if (!pendingMode) return;
    const mode = pendingMode;
    setModeConfirmOpen(false);
    setPendingMode(null);
    setActiveMode(mode);
    setSelectedDuration(mode.dur);
    setStatus('idle');
    setTimeLeft(mode.dur * 60);
  };

  const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const totalSeconds = selectedDuration * 60;
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <>
      <div className={`bg-white rounded-[32px] p-5 lg:p-6 relative overflow-hidden flex flex-col group transition-all duration-700 w-full shadow-[0_8px_40px_rgba(15,23,42,0.04)] hover:shadow-[0_20px_60px_rgba(15,23,42,0.06)] border border-slate-100 ${status === 'running' ? 'ring-1 ring-black/5' : ''}`}>
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-[20px] bg-violet-50 flex items-center justify-center text-violet-600 shadow-sm border border-violet-100/50`}>
              <Sparkles size={24} className="opacity-90" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Focus Engine</h3>
              <p className="text-[12px] font-bold text-slate-400">Tactical Timer &bull; {activeMode.label} Mode</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white border border-slate-200/80 rounded-[18px] px-5 py-3 shadow-[0_2px_10px_rgba(15,23,42,0.02)]">
              <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center border border-violet-100 shrink-0">
                <Target size={14} className="text-violet-500" />
              </div>
              <div className="flex flex-col pr-2">
                <span className="text-[9px] font-black text-violet-500 uppercase tracking-[0.2em]">Active Mission</span>
                <span className="text-[12px] font-bold text-slate-700 leading-tight">Refactoring orchestration pipeline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center relative z-10 mb-6">
          
          {/* Left Panel: LIVE INTELLIGENCE */}
          <motion.div 
            animate={{ backgroundColor: `${activeMode.stroke}08`, borderColor: `${activeMode.stroke}15` }}
            transition={{ duration: 0.5 }}
            className="hidden lg:flex lg:col-span-3 flex-col gap-5 rounded-[24px] p-5 border shadow-[0_2px_15px_rgba(15,23,42,0.02)] h-full"
          >
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
              <Activity size={14} className={activeMode.color} /> Live Intelligence
            </h4>
            
            <div className="flex flex-col gap-5">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Peak Focus Window</span>
                <span className="text-[15px] font-black text-slate-800">10:00 - 12:30</span>
              </div>
              
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1.5">Focus Efficiency</span>
                <div className="flex items-center gap-3">
                  <span className="text-[15px] font-black text-emerald-500">92%</span>
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-emerald-500 rounded-full" />
                  </div>
                </div>
              </div>
              
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Distraction Level</span>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-[14px] font-bold text-slate-700">Low</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Session Consistency</span>
                <div className="flex items-center justify-between">
                  <span className={`text-[14px] font-bold ${activeMode.color}`}>Great</span>
                  <motion.svg animate={{ stroke: activeMode.stroke }} transition={{ duration: 0.5 }} width="60" height="20" viewBox="0 0 60 20" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M 0 15 Q 5 10, 10 12 T 20 8 T 30 14 T 40 5 T 50 10 T 60 2" />
                  </motion.svg>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Center Area: RADIAL TIMER */}
          <div className="col-span-1 lg:col-span-6 flex flex-col items-center justify-center">
             <div className="relative w-[280px] h-[280px] flex items-center justify-center mb-6 mt-2">
                {/* Ambient breathing glow when running */}
                {status === 'running' && (
                  <motion.div animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className={`absolute inset-0 rounded-full blur-2xl`} style={{ backgroundColor: activeMode.stroke }} />
                )}
                
                {/* SVG Radial Progress */}
                <svg className="w-full h-full transform -rotate-90 relative z-10 filter drop-shadow-[0_0_15px_rgba(15,23,42,0.05)]">
                  {/* Background Track */}
                  <circle cx="140" cy="140" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                  
                  {/* Animated Progress Ring */}
                  <motion.circle
                    cx="140" cy="140" r={radius} fill="transparent" stroke={activeMode.stroke} strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                  
                  {/* Subtle orbit dots on the ring background */}
                  {Array.from({length: 12}).map((_, i) => (
                      <circle cx={140 + (radius + 20) * Math.cos(i * Math.PI / 6)} cy={140 + (radius + 20) * Math.sin(i * Math.PI / 6)} r="1.5" fill="#cbd5e1" key={i} />
                  ))}
                  
                  {/* Thumb indicator on the progress ring */}
                  <motion.circle 
                     cx={140 + radius * Math.cos(2 * Math.PI * (progressPercent / 100))}
                     cy={140 + radius * Math.sin(2 * Math.PI * (progressPercent / 100))}
                     r="8"
                     fill="white"
                     stroke={activeMode.stroke}
                     strokeWidth="4"
                     className="transition-all duration-500"
                  />
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                  <button className={`flex items-center gap-1 text-[11px] font-black ${activeMode.color} mb-1 hover:opacity-80 transition-opacity`}>
                    {activeMode.label} <ChevronDown size={14} />
                  </button>
                  <motion.span 
                    animate={{ scale: status === 'running' ? [1, 1.02, 1] : 1 }} 
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="text-[4.5rem] font-black text-slate-800 tracking-tighter tabular-nums leading-none mb-1 filter drop-shadow-sm"
                  >
                    {formatTime(timeLeft)}
                  </motion.span>
                  <span className={`text-[11px] font-black uppercase tracking-[0.25em] ${status === 'running' ? activeMode.color : 'text-slate-400'}`}>
                    {status === 'running' ? 'In Progress' : status === 'paused' ? 'Paused' : status === 'finished' ? 'Complete' : 'Ready To Focus'}
                  </span>
                </div>
             </div>

             {/* Primary Controls */}
             <div className="flex items-center gap-3 w-full max-w-[280px] px-2">
               <button
                 onClick={handleStartPause}
                 className={`flex-1 py-3 px-6 rounded-[18px] text-[14px] font-black text-white flex items-center justify-center gap-2 transition-all duration-300 shadow-md ${
                   status === 'running' ? 'bg-amber-500 hover:bg-amber-600 hover:shadow-lg hover:-translate-y-0.5' : `${activeMode.bg} ${activeMode.hoverBg} hover:shadow-[0_10px_25px_rgba(15,23,42,0.15)] hover:-translate-y-0.5`
                 }`}
               >
                 {status === 'running' ? <><Pause size={16} fill="currentColor" /> Pause</> : <><Play size={16} fill="currentColor" /> Start Focus</>}
               </button>
               <button
                 onClick={handleReset} disabled={status === 'idle'}
                 className="w-[50px] h-[50px] rounded-[18px] bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-sm"
               >
                 <RotateCcw size={16} />
               </button>
             </div>
          </div>

          {/* Right Panel: SESSION MEMORY */}
          <motion.div 
            animate={{ backgroundColor: `${activeMode.stroke}08`, borderColor: `${activeMode.stroke}15` }}
            transition={{ duration: 0.5 }}
            className="hidden lg:flex lg:col-span-3 flex-col gap-5 rounded-[24px] p-5 border shadow-[0_2px_15px_rgba(15,23,42,0.02)] h-full"
          >
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
               <Clock size={14} className={activeMode.color} /> Session Memory
             </h4>
             
             <div className="flex flex-col gap-4 flex-1">
               <div>
                 <span className="text-[11px] font-bold text-slate-400 block mb-1">Last Session</span>
                 <span className="text-[14px] font-black text-slate-800 line-clamp-1">Optimize Kanban DnD</span>
               </div>
               
               <div className="flex flex-col gap-3">
                 <div className="flex items-center justify-between">
                   <span className="text-[12px] font-bold text-slate-400">Duration</span>
                   <span className="text-[13px] font-black text-slate-800">80m</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-[12px] font-bold text-slate-400">Files Modified</span>
                   <span className="text-[13px] font-black text-slate-800">14</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-[12px] font-bold text-slate-400">Commits</span>
                   <span className="text-[13px] font-black text-slate-800">3</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-[12px] font-bold text-slate-400">Focus Score</span>
                   <span className="text-[13px] font-black text-emerald-500">94%</span>
                 </div>
               </div>

               <motion.button 
                 animate={{ backgroundColor: `${activeMode.stroke}15`, color: activeMode.stroke, borderColor: `${activeMode.stroke}30` }}
                 className="mt-auto w-full py-2.5 rounded-xl font-bold text-[12px] flex items-center justify-center gap-2 transition-colors border"
               >
                 <BarChart2 size={14} /> View Session History
               </motion.button>
             </div>
          </motion.div>
        </div>

        {/* Bottom Mode Selector */}
        <div className="flex justify-center mt-2 relative z-10">
          <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-50 border border-slate-100 rounded-full px-2 py-2 shadow-inner">
            {SESSION_MODES.map(mode => {
              const isSelected = activeMode.id === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => selectMode(mode)}
                  className={`relative px-4 py-2 rounded-full text-[12px] font-bold transition-all duration-300 flex items-center gap-2 ${
                    isSelected ? `bg-white shadow-[0_2px_10px_rgba(15,23,42,0.06)] ${mode.color}` : 'bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? mode.bg : 'bg-transparent'}`} />
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      <ConfirmationModal
        isOpen={modeConfirmOpen}
        title="Switch Session Mode"
        message={`Are you sure you want to switch to ${pendingMode?.label} mode? This will reset the current running timer.`}
        confirmLabel="Switch Mode"
        cancelLabel="Continue Focus"
        type="warning"
        onConfirm={handleConfirmModeChange}
        onCancel={() => {
          setModeConfirmOpen(false);
          setPendingMode(null);
        }}
      />
    </>
  );
};
