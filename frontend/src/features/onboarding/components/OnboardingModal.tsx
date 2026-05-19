import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '../../../hooks/useOnboarding';
import { useUIStore } from '../../../store/uiStore';
import { 
  Zap, 
  Terminal, 
  Code2, 
  Flame, 
  Target, 
  Check, 
  Play, 
  ChevronRight,
  Cpu, 
  Trophy,
  Github
} from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { 
    progress, 
    isLoading, 
    completeStep, 
    completeOnboarding 
  } = useOnboarding();

  const addToast = useUIStore((s) => s.addToast);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Platform usernames
  const [leetcodeUser, setLeetcodeUser] = useState('');
  const [codeforcesUser, setCodeforcesUser] = useState('');
  const [githubUser, setGithubUser] = useState('');

  // Syncing states
  const [leetcodeStatus, setLeetcodeStatus] = useState<'idle' | 'syncing' | 'connected'>('idle');
  const [codeforcesStatus, setCodeforcesStatus] = useState<'idle' | 'syncing' | 'connected'>('idle');
  const [githubStatus, setGithubStatus] = useState<'idle' | 'syncing' | 'connected'>('idle');

  // Goals
  const [focusGoal, setFocusGoal] = useState('2h');
  const [focusTarget, setFocusTarget] = useState('dsa');
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['javascript']);

  useEffect(() => {
    if (progress && !progress.isCompleted) {
      setIsOpen(true);
      // Align step index
      const dbStep = progress.steps.findIndex(s => !s.completed && !s.skipped);
      if (dbStep !== -1) {
        setCurrentStepIdx(dbStep);
      }
    } else {
      setIsOpen(false);
    }
  }, [progress]);

  if (isLoading || !progress || !isOpen) return null;

  const steps = [
    { id: 'welcome', title: 'Welcome' },
    { id: 'connect', title: 'Platform Link' },
    { id: 'personalize', title: 'Calibration' },
    { id: 'momentum', title: 'Momentum Map' },
    { id: 'first-action', title: 'Activation' },
  ];

  const handleNext = async () => {
    const currentStepId = steps[currentStepIdx].id;
    
    // Trigger step completion on backend
    completeStep(currentStepId);

    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      // Last step, complete onboarding entirely
      completeOnboarding();
      setIsOpen(false);
      addToast({
        type: 'success',
        title: 'Calibration Successful',
        message: 'Onboarding completed! Welcome to DevTrack.',
        duration: 4000
      });
    }
  };

  const skipAll = () => {
    completeOnboarding();
    setIsOpen(false);
    addToast({
      type: 'info',
      title: 'Setup Bypassed',
      message: 'Onboarding skipped. You can configure your settings anytime.',
      duration: 3000
    });
  };

  const handleConnectPlatform = (platform: 'leetcode' | 'codeforces' | 'github', username: string) => {
    if (!username.trim()) return;

    if (platform === 'leetcode') {
      setLeetcodeStatus('syncing');
      setTimeout(() => {
        setLeetcodeStatus('connected');
        addToast({ type: 'success', title: 'LeetCode Connected', message: `Telemetry linked to ${username}` });
      }, 1200);
    } else if (platform === 'codeforces') {
      setCodeforcesStatus('syncing');
      setTimeout(() => {
        setCodeforcesStatus('connected');
        addToast({ type: 'success', title: 'Codeforces Connected', message: `Telemetry linked to ${username}` });
      }, 1200);
    } else if (platform === 'github') {
      setGithubStatus('syncing');
      setTimeout(() => {
        setGithubStatus('connected');
        addToast({ type: 'success', title: 'GitHub Connected', message: `Repository sync active for ${username}` });
      }, 1200);
    }
  };

  const toggleLanguage = (lang: string) => {
    if (selectedLangs.includes(lang)) {
      setSelectedLangs(prev => prev.filter(l => l !== lang));
    } else {
      setSelectedLangs(prev => [...prev, lang]);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xl p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className="relative w-full max-w-2xl bg-white/90 border border-slate-200/80 rounded-[32px] shadow-[0_24px_80px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col md:flex-row min-h-[460px]"
        >
          {/* LEFT SIDEBAR: Steps timeline */}
          <div className="w-full md:w-56 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200/50 p-6 flex flex-col justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center shadow-md shrink-0">
                  <Zap className="w-[15px] h-[15px] text-white" />
                </div>
                <span className="font-bold text-sm text-slate-800 uppercase tracking-wider">DevTrack OS</span>
              </div>

              {/* Steps timeline dots */}
              <div className="space-y-4">
                {steps.map((step, idx) => {
                  const isActive = idx === currentStepIdx;
                  const isDone = idx < currentStepIdx;
                  return (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-300 shrink-0 ${
                        isActive 
                          ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 text-[#8B5CF6]' 
                          : isDone 
                            ? 'border-emerald-500 bg-emerald-500 text-white' 
                            : 'border-slate-300 bg-transparent text-slate-400'
                      }`}>
                        {isDone ? <Check size={10} className="stroke-[3]" /> : <span className="text-[9px] font-bold">{idx + 1}</span>}
                      </div>
                      <span className={`text-[11px] font-bold tracking-tight transition-colors ${
                        isActive ? 'text-slate-800 font-extrabold' : isDone ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={skipAll}
              className="mt-8 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-[#8B5CF6] transition-colors text-left"
            >
              Skip Onboarding
            </button>
          </div>

          {/* RIGHT SIDEBAR: Content panel */}
          <div className="flex-1 p-8 flex flex-col justify-between bg-white relative">
            
            {/* Steps animations container */}
            <div className="flex-1 flex flex-col justify-center min-h-[300px]">
              <AnimatePresence mode="wait">
                
                {/* STEP 1: WELCOME SCREEN */}
                {currentStepIdx === 0 && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-violet-100 text-[#8B5CF6] flex items-center justify-center shadow-sm">
                      <Cpu size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
                        Power up your developer routine.
                      </h2>
                      <p className="text-xs font-semibold text-slate-500 mt-2 leading-relaxed">
                        DevTrack is a premium Engineering Operating System built to automate activity syncing, reinforce focus, and reward code consistency.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
                        <Flame className="w-4 h-4 text-orange-500 mb-2" />
                        <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wide">Consistency Engine</h4>
                        <p className="text-[10px] font-semibold text-slate-400 mt-1">Streaks, XP, and pacing optimized for you.</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
                        <Terminal className="w-4 h-4 text-[#8B5CF6] mb-2" />
                        <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wide">Developer Hub</h4>
                        <p className="text-[10px] font-semibold text-slate-400 mt-1">Automatic sync across LeetCode, Codeforces, and GitHub.</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: PLATFORM CONNECTIONS */}
                {currentStepIdx === 1 && (
                  <motion.div
                    key="connect"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight">
                        Connect platforms.
                      </h2>
                      <p className="text-[11px] font-semibold text-slate-500 mt-1 leading-relaxed">
                        Synchronize your coding activities to build momentum metrics in real time.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {/* LeetCode Input */}
                      <div className="flex gap-2 items-center">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                          <Code2 size={16} />
                        </div>
                        <input
                          type="text"
                          placeholder="LeetCode username"
                          value={leetcodeUser}
                          onChange={(e) => setLeetcodeUser(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#8B5CF6]"
                          disabled={leetcodeStatus === 'connected'}
                        />
                        <button
                          type="button"
                          onClick={() => handleConnectPlatform('leetcode', leetcodeUser)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wide transition-all border ${
                            leetcodeStatus === 'connected'
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-[#8B5CF6] border-[#8B5CF6] text-white hover:shadow-md'
                          }`}
                          disabled={leetcodeStatus === 'connected' || leetcodeStatus === 'syncing'}
                        >
                          {leetcodeStatus === 'syncing' ? '...' : leetcodeStatus === 'connected' ? 'Linked' : 'Link'}
                        </button>
                      </div>

                      {/* Codeforces Input */}
                      <div className="flex gap-2 items-center">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                          <Trophy size={16} />
                        </div>
                        <input
                          type="text"
                          placeholder="Codeforces username"
                          value={codeforcesUser}
                          onChange={(e) => setCodeforcesUser(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#8B5CF6]"
                          disabled={codeforcesStatus === 'connected'}
                        />
                        <button
                          type="button"
                          onClick={() => handleConnectPlatform('codeforces', codeforcesUser)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wide transition-all border ${
                            codeforcesStatus === 'connected'
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-[#8B5CF6] border-[#8B5CF6] text-white hover:shadow-md'
                          }`}
                          disabled={codeforcesStatus === 'connected' || codeforcesStatus === 'syncing'}
                        >
                          {codeforcesStatus === 'syncing' ? '...' : codeforcesStatus === 'connected' ? 'Linked' : 'Link'}
                        </button>
                      </div>

                      {/* GitHub Input */}
                      <div className="flex gap-2 items-center">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900/10 text-zinc-800 flex items-center justify-center shrink-0">
                          <Github size={16} />
                        </div>
                        <input
                          type="text"
                          placeholder="GitHub username"
                          value={githubUser}
                          onChange={(e) => setGithubUser(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#8B5CF6]"
                          disabled={githubStatus === 'connected'}
                        />
                        <button
                          type="button"
                          onClick={() => handleConnectPlatform('github', githubUser)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wide transition-all border ${
                            githubStatus === 'connected'
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-[#8B5CF6] border-[#8B5CF6] text-white hover:shadow-md'
                          }`}
                          disabled={githubStatus === 'connected' || githubStatus === 'syncing'}
                        >
                          {githubStatus === 'syncing' ? '...' : githubStatus === 'connected' ? 'Linked' : 'Link'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: PERSONALIZATION & CALIBRATION */}
                {currentStepIdx === 2 && (
                  <motion.div
                    key="personalize"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight">
                        Calibrate your daily targets.
                      </h2>
                      <p className="text-[11px] font-semibold text-slate-500 mt-1 leading-relaxed">
                        Customize focus targets and languages to tailor notifications and achievements.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Focus hours picker */}
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Daily Focus Target</span>
                        <div className="flex gap-2">
                          {['1h', '2h', '4h', '6h'].map((time) => (
                            <button
                              key={time}
                              onClick={() => setFocusGoal(time)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                focusGoal === time
                                  ? 'bg-[#8B5CF6]/10 border-[#8B5CF6] text-[#8B5CF6]'
                                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Main focus type */}
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Primary Objective</span>
                        <div className="flex gap-2">
                          {[
                            { id: 'dsa', label: 'DSA Prep' },
                            { id: 'dev', label: 'App Building' },
                            { id: 'competitive', label: 'Codeforces' }
                          ].map((t) => (
                            <button
                              key={t.id}
                              onClick={() => setFocusTarget(t.id)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                focusTarget === t.id
                                  ? 'bg-[#8B5CF6]/10 border-[#8B5CF6] text-[#8B5CF6]'
                                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Coding Languages */}
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Preferred Languages</span>
                        <div className="flex flex-wrap gap-2">
                          {['javascript', 'python', 'go', 'rust', 'cpp', 'java'].map((lang) => {
                            const selected = selectedLangs.includes(lang);
                            return (
                              <button
                                key={lang}
                                onClick={() => toggleLanguage(lang)}
                                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border uppercase tracking-wider ${
                                  selected
                                    ? 'bg-slate-800 border-slate-800 text-white'
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                }`}
                              >
                                {lang}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: MOMENTUM SYSTEM MAP */}
                {currentStepIdx === 3 && (
                  <motion.div
                    key="momentum"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight">
                        The Momentum Mechanics.
                      </h2>
                      <p className="text-[11px] font-semibold text-slate-500 mt-1 leading-relaxed">
                        Consistency drives retention. Keep these core concepts in mind:
                      </p>
                    </div>

                    <div className="space-y-3.5">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                          <Flame className="w-4.5 h-4.5 text-orange-500" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wide">Activity Streaks</h4>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 leading-normal">
                            Code daily to grow your streak. A 24-hour absence puts your streak at risk!
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                          <Trophy className="w-4.5 h-4.5 text-[#8B5CF6]" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wide">XP and Levels</h4>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 leading-normal">
                            Unlock achievements and complete problems to earn XP. Ascend to higher tiers.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Target className="w-4.5 h-4.5 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wide">Calibration & Missions</h4>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 leading-normal">
                            Complete daily and weekly missions to secure massive progression bonuses.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 5: FINAL ACTIVATION CALL TO ACTION */}
                {currentStepIdx === 4 && (
                  <motion.div
                    key="launch"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6 text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center shadow-inner mx-auto">
                      <Check size={28} className="stroke-[3]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
                        Calibration Complete!
                      </h2>
                      <p className="text-xs font-semibold text-slate-500 mt-2 leading-relaxed max-w-sm mx-auto">
                        Your developer ecosystem is initialized. You have been awarded 50 XP as a welcome bonus!
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-3 text-left">
                      <div className="w-8 h-8 rounded-lg bg-[#8B5CF6] text-white flex items-center justify-center shrink-0">
                        <Play size={14} className="fill-white pl-0.5" />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-extrabold text-[#8B5CF6] uppercase tracking-wide">First Action CTA</h4>
                        <p className="text-[10px] font-bold text-slate-500">Trigger your first platform sync or start a focus timer to activate your streaks.</p>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* BUTTON CONTROLS FOOTER */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (currentStepIdx > 0) {
                    setCurrentStepIdx(prev => prev - 1);
                  }
                }}
                className={`text-[11px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-slate-800 transition-colors ${
                  currentStepIdx === 0 ? 'opacity-0 pointer-events-none' : ''
                }`}
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white rounded-full text-xs font-black shadow-md hover:shadow-lg transition-all active:scale-95 uppercase tracking-wider"
              >
                {currentStepIdx === steps.length - 1 ? 'Launch Engine' : 'Next Step'}
                <ChevronRight size={14} className="stroke-[2.5]" />
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
