import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplets, 
  RotateCcw, 
  Plus, 
  Trophy, 
  Sparkles, 
  Calendar,
  X as XIcon,
  Bell,
  BellOff,
  BarChart3,
  Waves,
  Zap,
  CheckCircle2,
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
    const savedGlasses = localStorage.getItem('water_glasses');
    const savedGoal = localStorage.getItem('water_goal');
    const savedSize = localStorage.getItem('water_size');
    const savedDate = localStorage.getItem('water_date');
    const savedNotifs = localStorage.getItem('water_notifs');
    const today = new Date().toDateString();

    if (savedGoal) setDailyGoal(parseInt(savedGoal));
    if (savedSize) setGlassSize(parseInt(savedSize));
    
    if (savedDate !== today) {
      setGlasses(0);
      localStorage.setItem('water_glasses', '0');
      localStorage.setItem('water_date', today);
    } else if (savedGlasses) {
      setGlasses(parseInt(savedGlasses));
    }

    if (savedNotifs === 'true') setNotificationsEnabled(true);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (notificationsEnabled) {
      if (Notification.permission !== 'granted') Notification.requestPermission();
      interval = setInterval(() => {
        if (Notification.permission === 'granted') {
          new Notification("HYDRA-CORE", {
            body: "[SYSTEM] 수분 보치가 필요합니다. 즉시 섭취하십시오. 💧",
            icon: "https://cdn-icons-png.flaticon.com/512/3105/3105807.png"
          });
        }
      }, 3600000);
    }
    return () => clearInterval(interval);
  }, [notificationsEnabled]);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {}
  };

  const toggleNotifications = () => {
    const nextState = !notificationsEnabled;
    setNotificationsEnabled(nextState);
    localStorage.setItem('water_notifs', nextState.toString());
    if (nextState && Notification.permission !== 'granted') Notification.requestPermission();
  };

  const addGlass = (e: React.MouseEvent) => {
    const newVal = glasses + 1;
    setGlasses(newVal);
    localStorage.setItem('water_glasses', newVal.toString());
    
    const newDroplet = { id: Date.now(), x: e.clientX, y: e.clientY };
    setDroplets(prev => [...prev, newDroplet]);
    setTimeout(() => setDroplets(prev => prev.filter(d => d.id !== newDroplet.id)), 800);

    playBeep();

    const currentProgress = (newVal / dailyGoal) * 100;
    if (newVal === dailyGoal) {
      triggerCoach(`오늘 목표 ${dailyGoal}잔을 완벽하게 달성했습니다. 분석을 시작합니다.`);
    } else if (currentProgress >= 75 && currentProgress - (100/dailyGoal) < 75) {
      triggerCoach("STATUS: 75%_COMPLETE. 시스템 가동률이 최적화되었습니다.");
    } else if (currentProgress >= 50 && currentProgress - (100/dailyGoal) < 50) {
      triggerCoach("STATUS: 50%_COMPLETE. 데이터 손실 방지를 위해 수분 보충을 지속하십시오.");
    }
  };

  const triggerCoach = async (prompt: string) => {
    setIsTyping(true);
    setIsCoachOpen(true);
    const msg = await askGemini(`홀로그래픽 테마의 시스템 AI처럼 말해줘. 사용자 상황: ${prompt}`);
    setCoachResponse(msg || '[SYSTEM] 데이터 통신 오류. 수분 보충을 권장합니다.');
    setIsTyping(false);
  };

  const resetManual = () => {
    if (confirm('시스템을 초기화하시겠습니까?')) {
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

  const progress = Math.min((glasses / dailyGoal) * 100, 100);
  const totalMl = glasses * glassSize;

  if (!mounted) return null;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen text-[#00f2ff] selection:bg-[#00f2ff]/30 font-mono relative overflow-x-hidden">
      <div className="scanline" />
      <div className="terrain-grid" />
      
      <AnimatePresence>
        {droplets.map(droplet => (
          <motion.div
            key={droplet.id}
            initial={{ opacity: 1, y: droplet.y, x: droplet.x, scale: 0.2 }}
            animate={{ opacity: 0, y: droplet.y - 150, x: droplet.x, scale: 2, rotate: 45 }}
            className="fixed pointer-events-none z-[100] text-[#00f2ff]"
          >
            <Zap className="w-8 h-8 fill-current" />
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Header */}
          <motion.div variants={item} className="md:col-span-12 flex justify-between items-center bg-[#00f2ff]/5 p-6 neon-border rounded-xl">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 flex items-center justify-center neon-border rounded-lg bg-[#00f2ff]/10">
                <Waves className="w-10 h-10 holographic-glow animate-pulse" />
              </div>
              <div className="space-y-1">
                <h1 className="text-4xl font-black italic tracking-tighter holographic-glow uppercase">Hydra-Core</h1>
                <p className="text-[10px] font-bold text-[#00f2ff]/60 tracking-[0.4em]">SYS_VER: 2.1.0_HOLO</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="p-3 neon-border rounded-lg hover:bg-[#00f2ff]/10 transition-all cursor-pointer">
                <Settings className="w-5 h-5" />
              </button>
              <button onClick={toggleNotifications} className={`p-3 neon-border rounded-lg transition-all cursor-pointer ${notificationsEnabled ? 'bg-[#00f2ff]/20' : 'opacity-40'}`}>
                {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </button>
              <button onClick={resetManual} className="p-3 neon-border rounded-lg hover:bg-red-500/20 text-red-400 border-red-500/30 transition-all cursor-pointer">
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Settings Overlay */}
          <AnimatePresence>
            {isSettingsOpen && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="md:col-span-12">
                <div className="neon-border p-8 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-8 border-dashed border-2">
                  <div>
                    <h3 className="text-xs font-black mb-4 tracking-widest text-[#00f2ff]/50 uppercase italic">// Set Target Unit Count</h3>
                    <div className="grid grid-cols-4 gap-3">
                      {[6, 8, 10, 12].map(g => (
                        <button key={g} onClick={() => updateGoal(g)} className={`py-4 rounded font-black text-sm border transition-all ${dailyGoal === g ? 'bg-[#00f2ff] text-black shadow-[0_0_20px_#00f2ff]' : 'border-[#00f2ff]/20 hover:bg-[#00f2ff]/10'}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-black mb-4 tracking-widest text-[#00f2ff]/50 uppercase italic">// Set Unit Magnitude</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[200, 250, 300].map(size => (
                        <button key={size} onClick={() => updateSize(size)} className={`py-4 rounded font-black text-sm border transition-all ${glassSize === size ? 'bg-[#00f2ff] text-black shadow-[0_0_20px_#00f2ff]' : 'border-[#00f2ff]/20 hover:bg-[#00f2ff]/10'}`}>
                          {size}ml
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Visualized Tracking */}
          <motion.div variants={item} className="md:col-span-8">
            <div className="neon-border p-12 rounded-[2rem] flex flex-col items-center relative overflow-hidden group min-h-[500px] justify-center text-center">
              <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-1000">
                <BarChart3 className="w-32 h-32" />
              </div>

              <div className="relative mb-8">
                <div className="w-72 h-72 rounded-full border-2 border-[#00f2ff]/20 flex items-center justify-center relative isolation-isolate p-2">
                  <div className="absolute inset-0 rounded-full border border-dashed border-[#00f2ff]/30 opacity-50 animate-[spin_20s_linear_infinite]" />
                  
                  <div className="w-full h-full rounded-full overflow-hidden relative bg-black/40 shadow-[inset_0_0_50px_rgba(0,242,255,0.1)] flex items-center justify-center">
                    <motion.div key={glasses} initial={{ scale: 0.9, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} className="z-10 text-center">
                      <span className="text-9xl font-black italic holographic-glow leading-none select-none">
                        {glasses < 10 ? `0${glasses}` : glasses}
                      </span>
                      <div className="mt-4 text-[10px] font-black tracking-[0.5em] text-[#00f2ff]/50 uppercase">Hydra units</div>
                    </motion.div>
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-[#00f2ff]/20 backdrop-blur-sm shadow-[0_-20px_40px_rgba(0,242,255,0.1)] transition-all duration-1000 ease-in-out border-t-2 border-[#00f2ff]/50" style={{ height: `${progress}%` }}>
                      <div className="absolute -top-1 left-0 right-0 h-1 bg-[#00f2ff] holographic-glow opacity-50" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-lg space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-end px-2">
                    <span className="text-xs font-black tracking-widest italic text-[#00f2ff]/60 uppercase">System Integration: {totalMl}ml</span>
                    <span className="text-xl font-black italic holographic-glow tracking-tighter">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-6 w-full bg-black/50 neon-border p-1 overflow-hidden relative">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-[#00f2ff] shadow-[0_0_20px_#00f2ff] relative" />
                  </div>
                </div>

                <motion.button whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(0, 242, 255, 0.4)' }} whileTap={{ scale: 0.98 }} onClick={addGlass} className="w-full py-6 bg-transparent neon-border hover:bg-[#00f2ff]/10 text-[#00f2ff] rounded-xl font-black text-xl tracking-widest uppercase italic shadow-lg cursor-pointer flex items-center justify-center gap-4 group">
                  <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform" />
                  INIT_INTAKE_MODULE
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* HUD Cards */}
          <motion.div variants={item} className="md:col-span-4 space-y-6 text-left">
            <div className="neon-border p-8 rounded-[2rem] bg-[#00f2ff]/5 border-dashed border-2 min-h-[220px] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6 opacity-60">
                   <Zap className="w-4 h-4 holographic-glow" />
                   <h3 className="text-[10px] font-black tracking-[0.3em] uppercase">Core_Status</h3>
                </div>
                <p className="text-sm font-bold leading-relaxed text-[#00f2ff]/80 italic">
                  {progress < 100 ? ">> SCANNING: RESOURCE_DEPLETED. 수분 보충이 필요합니다." : ">> SCANNING: OPTIMAL_STATE. 최고 가동 상태입니다."}
                </p>
              </div>
              <div className="text-[9px] font-black tracking-widest opacity-40 uppercase pt-6">CLOCK: {new Date().toLocaleTimeString()}</div>
            </div>

            <div className="neon-border p-8 rounded-[2rem] bg-black/60 relative overflow-hidden flex flex-col justify-between min-h-[260px]">
              <div className="absolute -bottom-10 -right-10 opacity-5"><Trophy className="w-48 h-48" /></div>
              <div>
                <h3 className="text-xs font-black mb-6 tracking-widest text-[#00f2ff]/50 uppercase italic">// Mission_Summary</h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-[#00f2ff]/10 pb-3">
                    <span className="text-[10px] font-bold opacity-60 uppercase">Integrity</span>
                    <span className="text-3xl font-black italic">{Math.round(progress)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold opacity-60 uppercase">Units</span>
                    <span className="text-3xl font-black italic">{glasses}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => triggerCoach('상태 리포트')} className="w-full mt-8 py-3 neon-border hover:bg-[#00f2ff]/20 text-[10px] font-black tracking-widest uppercase transition-all cursor-pointer flex items-center justify-center gap-2"><Sparkles className="w-4 h-4" /> RE_CALIBRATE AI</button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* AI HUD */}
      <AnimatePresence>
        {isCoachOpen && (
          <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} className="fixed bottom-12 right-12 z-[100] max-w-md">
            <div className="neon-border p-8 rounded-[2rem] bg-[#05060a]/90 backdrop-blur-2xl relative border-2 border-double">
              <button onClick={() => setIsCoachOpen(false)} className="absolute top-6 right-6 text-[#00f2ff]/40 hover:text-[#00f2ff] cursor-pointer"><XIcon className="w-5 h-5" /></button>
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 neon-border rounded-lg flex items-center justify-center bg-[#00f2ff]/10"><Coffee className="w-8 h-8 holographic-glow" /></div>
                <div className="flex-1 space-y-2">
                  <h4 className="text-[10px] font-black text-[#00f2ff] tracking-[0.4em] uppercase underline underline-offset-8">NEURAL_BRIDGE</h4>
                  <div className="text-sm font-bold text-[#c0c5cc] italic">{isTyping ? ">> DECODING..." : coachResponse}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
