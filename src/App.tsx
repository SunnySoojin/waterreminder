import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplets, 
  RotateCcw, 
  Plus, 
  Trophy, 
  Sparkles, 
  Calendar,
  MessageSquare,
  X as XIcon,
  Bell,
  BellOff,
  BarChart3,
  Waves,
  Zap,
  CheckCircle2,
  Moon,
  Sun,
  Settings,
  Coffee,
  GlassWater
} from 'lucide-react';
import { askGemini } from './services/geminiService';

interface Droplet {
  id: number;
  x: number;
  y: number;
}

export default function App() {
  // --- State Management ---
  const [glasses, setGlasses] = useState<number>(0);
  const [dailyGoal, setDailyGoal] = useState<number>(8);
  const [glassSize, setGlassSize] = useState<number>(250);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // UI States
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [coachResponse, setCoachResponse] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [droplets, setDroplets] = useState<Droplet[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- Persistence & Initialization ---
  useEffect(() => {
    setMounted(true);
    
    // Load from LocalStorage
    const savedGlasses = localStorage.getItem('water_glasses');
    const savedGoal = localStorage.getItem('water_goal');
    const savedSize = localStorage.getItem('water_size');
    const savedDate = localStorage.getItem('water_date');
    const savedNotifs = localStorage.getItem('water_notifs');
    const savedDarkMode = localStorage.getItem('water_darkmode');
    
    const today = new Date().toDateString();

    // Goal & Size
    if (savedGoal) setDailyGoal(parseInt(savedGoal));
    if (savedSize) setGlassSize(parseInt(savedSize));
    
    // Daily Reset Logic
    if (savedDate !== today) {
      setGlasses(0);
      localStorage.setItem('water_glasses', '0');
      localStorage.setItem('water_date', today);
    } else if (savedGlasses) {
      setGlasses(parseInt(savedGlasses));
    }

    // Settings
    if (savedNotifs === 'true') setNotificationsEnabled(true);
    if (savedDarkMode === 'true') setIsDarkMode(true);
  }, []);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('water_darkmode', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (notificationsEnabled) {
      if (Notification.permission !== 'granted') Notification.requestPermission();
      interval = setInterval(() => {
        if (Notification.permission === 'granted') {
          new Notification("AquaLog", {
            body: "지금 수분 충전이 필요한 시간이에요! 💧",
            icon: "https://cdn-icons-png.flaticon.com/512/3105/3105807.png"
          });
        }
      }, 3600000); // 1 hour for better UX
    }
    return () => clearInterval(interval);
  }, [notificationsEnabled]);

  // --- Handlers ---
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {}
  };

  const addGlass = (e: React.MouseEvent) => {
    const newVal = glasses + 1;
    setGlasses(newVal);
    localStorage.setItem('water_glasses', newVal.toString());
    
    const newDroplet = { id: Date.now(), x: e.clientX, y: e.clientY };
    setDroplets(prev => [...prev, newDroplet]);
    setTimeout(() => setDroplets(prev => prev.filter(d => d.id !== newDroplet.id)), 800);

    playBeep();

    // Threshold Messages
    const currentProgress = (newVal / dailyGoal) * 100;
    if (newVal === dailyGoal) {
      triggerCoach(`오늘 목표 ${dailyGoal}잔을 완벽하게 달성했어요! 기쁨의 격려 메시지를 부탁해요. 🏆✨`);
    } else if (currentProgress >= 75 && currentProgress - (100/dailyGoal) < 75) {
      triggerCoach("벌써 75%나 달성했어요! 조금만 더 하면 완벽해요. 🌟🌊");
    } else if (currentProgress >= 50 && currentProgress - (100/dailyGoal) < 50) {
      triggerCoach("절반이나 마셨네요! 수분 밸런스가 아주 좋아요. 💪💧");
    } else if (currentProgress >= 25 && currentProgress - (100/dailyGoal) < 25) {
      triggerCoach("첫 25% 성공! 좋은 시작입니다. 계속해서 충전해볼까요? 🌱💧");
    }
  };

  const toggleNotifications = () => {
    const nextState = !notificationsEnabled;
    setNotificationsEnabled(nextState);
    localStorage.setItem('water_notifs', nextState.toString());
    if (nextState && Notification.permission !== 'granted') Notification.requestPermission();
  };

  const triggerCoach = async (prompt: string) => {
    setIsTyping(true);
    setIsCoachOpen(true);
    const msg = await askGemini(prompt);
    setCoachResponse(msg || '매일 적당량의 물을 마시는 것은 건강의 시작입니다! 💧');
    setIsTyping(false);
  };

  const resetManual = () => {
    if (confirm('오늘의 수분 섭취 기록을 초기화할까요?')) {
      setGlasses(0);
      localStorage.setItem('water_glasses', '0');
    }
  };

  const updateGoal = (val: number) => {
    setDailyGoal(val);
    localStorage.setItem('water_goal', val.toString());
  };

  const updateSize = (val: number) => {
    setGlassSize(val);
    localStorage.setItem('water_size', val.toString());
  };

  // --- Calculations ---
  const progress = Math.min((glasses / dailyGoal) * 100, 100);
  const totalMl = glasses * glassSize;

  if (!mounted) return null;

  // --- Animations ---
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 overflow-x-hidden selection:bg-blue-200 ${
      isDarkMode ? 'bg-[#0F172A] text-slate-100' : 'sea-sky-gradient text-slate-900'
    }`}>
      <AnimatePresence>
        {droplets.map(droplet => (
          <motion.div
            key={droplet.id}
            initial={{ opacity: 1, y: droplet.y, x: droplet.x, scale: 0.5 }}
            animate={{ opacity: 0, y: droplet.y - 120, x: droplet.x + (Math.random() * 40 - 20), scale: 1.5, rotate: 20 }}
            exit={{ opacity: 0 }}
            className="fixed pointer-events-none z-[100] text-3xl"
          >
            💧
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-6 py-8 md:py-16">
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start"
        >
          {/* Header & Controls Area */}
          <motion.div variants={item} className="md:col-span-12 flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center shadow-xl ring-4 ring-white/30 ${
                isDarkMode ? 'bg-blue-600 shadow-blue-900/40' : 'bg-white shadow-blue-200'
              }`}>
                <Droplets className={`${isDarkMode ? 'text-white' : 'text-blue-500'} w-8 h-8 animate-wave`} />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight leading-none">AquaLog</h1>
                <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-700/60'}`}>Daily Hydration Hub</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center glass-morphism transition-all hover-lift cursor-pointer ${
                  isDarkMode ? 'text-yellow-400 bg-white/10' : 'text-slate-500'
                }`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center glass-morphism transition-all hover-lift cursor-pointer ${
                  isSettingsOpen ? 'text-blue-500' : 'text-slate-500'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>
              <button 
                onClick={toggleNotifications}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all hover-lift glass-morphism cursor-pointer ${
                  notificationsEnabled ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>

          {/* Settings Section (New) */}
          <AnimatePresence>
            {isSettingsOpen && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:col-span-12 overflow-hidden mb-6"
              >
                <div className={`glass-morphism rounded-[2rem] p-8 grid grid-cols-1 md:grid-cols-2 gap-8 ${isDarkMode ? 'bg-slate-800/50' : ''}`}>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-widest mb-4 opacity-60">Daily Goal (Glasses)</h3>
                    <div className="flex items-center gap-4">
                      {[6, 8, 10, 12].map(g => (
                        <button
                          key={g}
                          onClick={() => updateGoal(g)}
                          className={`flex-1 py-3 rounded-xl font-bold transition-all border ${
                            dailyGoal === g 
                              ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-widest mb-4 opacity-60">Glass Size (ml)</h3>
                    <div className="flex items-center gap-4">
                      {[200, 250, 300].map(size => (
                        <button
                          key={size}
                          onClick={() => updateSize(size)}
                          className={`flex-1 py-3 rounded-xl font-bold transition-all border ${
                            glassSize === size
                              ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {size}ml
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tracking Main Area */}
          <motion.div variants={item} className="md:col-span-8">
            <div className={`glass-morphism rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden ${
              isDarkMode ? 'bg-slate-800/40 border-white/5 shadow-2xl' : ''
            }`}>
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Waves className="w-32 h-32" />
              </div>
              
              <div className="relative">
                <div className={`w-56 h-56 md:w-64 md:h-64 rounded-full border-[12px] flex items-center justify-center relative shadow-inner overflow-hidden ${
                  isDarkMode ? 'border-slate-700 bg-slate-900/50' : 'border-white/40 bg-white/20'
                }`}>
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${progress}%` }}
                    transition={{ type: "spring", damping: 30, stiffness: 40 }}
                    className="absolute bottom-0 left-0 right-0 bg-blue-500/30 backdrop-blur-sm"
                  />
                  <div className="z-10 text-center">
                    <motion.span 
                      key={glasses}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className={`text-7xl md:text-8xl font-black block mb-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                    >
                      {glasses}
                    </motion.span>
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Glasses Collected</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full space-y-6 md:space-y-8">
                <div>
                  <div className="flex justify-between items-end mb-4 px-1">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight italic">Daily Hydration</h2>
                    <span className="text-blue-500 font-black text-xl md:text-2xl">{totalMl} <small className="opacity-40 text-sm font-bold uppercase">ml</small></span>
                  </div>
                  <div className="h-4 bg-slate-200/30 dark:bg-slate-700/50 rounded-full overflow-hidden p-1 shadow-inner ring-1 ring-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className={`h-full rounded-full shadow-lg ${isDarkMode ? 'bg-blue-500' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-slate-400 mt-3 uppercase tracking-tighter">
                    <span>{Math.round(progress)}% COMPLETED</span>
                    <span>TARGET: {dailyGoal * glassSize}ml</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addGlass}
                    className="flex-1 py-5 bg-blue-600 text-white rounded-3xl font-extrabold text-lg shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 cursor-pointer group hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                    Drink One Glass
                  </motion.button>
                  <button 
                    onClick={resetManual}
                    className={`w-16 rounded-3xl flex items-center justify-center shadow-xl transition-all cursor-pointer border ${
                      isDarkMode ? 'bg-slate-800 border-white/5 text-slate-400 hover:text-red-400' : 'bg-white border-white text-slate-300 hover:text-red-500'
                    }`}
                  >
                    <RotateCcw className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Cards Column */}
          <motion.div variants={item} className="md:col-span-4 grid grid-cols-1 gap-6 h-full">
            <div className={`glass-morphism rounded-[2.5rem] p-8 flex flex-col justify-between ${isDarkMode ? 'bg-slate-800/40 border-white/5' : ''}`}>
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDarkMode ? 'bg-blue-600/20 text-blue-400 font-bold' : 'bg-orange-100 text-orange-500'}`}>
                    {progress >= 100 ? <Trophy className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                  </div>
                  <h3 className="font-bold tracking-tight italic uppercase text-sm opacity-80">Hydration Insight</h3>
                </div>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm font-medium">
                  {glasses === 0 ? "건강한 하루를 위한 첫걸음, 지금 물 한 잔 어떠세요? 🌱" : 
                   progress < 50 ? "피부와 뇌는 수분에 민감합니다. 조금씩 자주 마시는 게 좋아요!" :
                   progress < 100 ? "목표가 머지않았습니다! 곧 몸의 컨디션이 올라갈 거예요. 💪" :
                   "완벽한 수분 밸런스입니다! 오늘 하루도 정말 고생 많으셨어요. 🌈✨"}
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Calendar className="w-4 h-4 opacity-50" /> {new Date().toLocaleDateString('ko-KR', { weekday: 'short' }).toUpperCase()}
                </span>
                {progress >= 100 && <div className="text-green-500 flex items-center gap-1 font-black text-[10px] italic">MAXED <CheckCircle2 className="w-4 h-4" /></div>}
              </div>
            </div>

            <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-600/30 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute bottom-0 right-0 p-4 opacity-10 translate-y-4 translate-x-4 group-hover:translate-y-0 group-hover:translate-x-0 transition-transform duration-700">
                <GlassWater className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                <h3 className="text-sm font-black mb-4 opacity-70 uppercase tracking-widest italic leading-none">Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] opacity-60 uppercase font-black tracking-widest">Efficiency</span>
                    <span className="text-2xl font-black italic">{Math.round(progress)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] opacity-60 uppercase font-black tracking-widest">Glass Unit</span>
                    <span className="text-2xl font-black italic">{glassSize} <small className="text-[10px] opacity-60">ml</small></span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => triggerCoach('수분 섭취 데이터를 바탕으로 내일의 건강 목표를 세워줘.')}
                className="mt-8 p-3 bg-white/20 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold hover:bg-white/30 transition-all cursor-pointer backdrop-blur-md border border-white/10"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI ANALYTICS</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* AI Coach Popover */}
      <AnimatePresence>
        {isCoachOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 left-0 right-0 px-6 z-[100] max-w-lg mx-auto"
          >
            <div className={`${isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-blue-50 text-slate-800'} rounded-[2.5rem] p-8 shadow-[0_30px_90px_rgba(15,23,42,0.4)] border relative`}>
              <button 
                onClick={() => setIsCoachOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
              >
                <XIcon className="w-5 h-5" />
              </button>
              
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 bg-blue-600/10 rounded-[1.25rem] flex items-center justify-center flex-shrink-0">
                  <Coffee className="w-7 h-7 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">AquaLog AI Assistant</h4>
                  {isTyping ? (
                    <div className="flex gap-2 py-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0s]" />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  ) : (
                    <p className="text-base leading-relaxed font-bold italic">
                      {coachResponse}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

