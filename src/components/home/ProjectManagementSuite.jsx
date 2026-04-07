import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FiPlus, 
  FiCheckCircle, 
  FiClock, 
  FiActivity,   
  FiTrendingUp,  
  FiCalendar,
  FiArrowUpRight,
  FiPlay,
  FiPause,
  FiMessageSquare,
  FiCheck,
  FiCornerDownRight
} from 'react-icons/fi';

export default function ProjectManagementSuite() {
  const [isTracking, setIsTracking] = useState(false);
  const [time, setTime] = useState(14825);

  useEffect(() => {
    let interval = null;
    if (isTracking) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const [feedItems, setFeedItems] = useState([
    { id: 1, user: 'Sarah K.', action: 'pushed 4 commits to', target: 'main-ui-refactor', time: 'Just now', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100', unread: true },
    { id: 2, user: 'Marcus Vance', action: 'requested review on', target: 'Stripe Integration', time: '12m ago', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100', unread: true },
  ]);

  const markAsRead = (id) => {
    setFeedItems(feedItems.filter(item => item.id !== id));
  };

  const tasks = [
    { id: 1, title: 'Redesign Landing Page Hero', category: 'Design', status: 'active', priority: 'High', progress: 75 },
    { id: 2, title: 'Integrate Stripe Webhooks', category: 'Backend', status: 'active', priority: 'Medium', progress: 40 },
    { id: 3, title: 'Launch Q3 Product Update', category: 'Marketing', status: 'completed', priority: 'High', progress: 100 },
  ];

  return (
    <div className="w-full lgLmt-40 max-w-340 mx-auto p-6 md:p-10 bg-white space-y-6">

      {/* SECTION 1: TASK TRACKER & KANBAN PREVIEW */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2 bg-[#F4F4F4] rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 flex flex-col justify-between min-h-[300px] md:min-h-[400px] border-2 border-black/5"
        >
          <div>
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="inline-block px-3 py-1 bg-white border-2 border-black rounded-full text-xs font-bold text-black mb-2">
                  Sprint 42
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#111111]">Active Sprint Backlog</h2>
              </div>
              <button className="p-3 bg-[#FF4D24] text-white rounded-full hover:bg-black transition-colors duration-200 border-2 border-black">
                <FiPlus size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className="bg-white border-2 border-black/10 hover:border-black rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${task.status === 'completed' ? 'bg-[#FF4D24]/10 text-[#FF4D24]' : 'bg-black/5 text-black'}`}>
                      <FiCheckCircle size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 leading-snug">{task.title}</h4>
                      <span className="text-xs text-gray-500 font-semibold">{task.category}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="w-32 bg-gray-100 rounded-full h-2.5 overflow-hidden border border-black/10">
                      <div 
                        className="bg-[#FF4D24] h-2.5 rounded-full" 
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{task.progress}%</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      task.priority === 'High' ? 'bg-[#FFE500] text-black border-2 border-black' : 'bg-gray-100 text-gray-600 border-2 border-black/10'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-[#FF4D24] text-white rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 flex flex-col justify-between relative overflow-hidden border-2 border-black"
        >
          <div>
            <div className="flex justify-between items-center">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold border border-white/30">Velocity</span>
              <FiTrendingUp className="text-white" size={24} />
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mt-6 leading-tight">
              Tasks cleared <br />this week
            </h3>
          </div>

          <div className="z-10 mt-auto">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter">84%</span>
              <span className="bg-[#FFE500] text-black text-xs font-bold px-2 py-1 rounded-full border-2 border-black">+12% vs last wk</span>
            </div>
            <p className="text-white/80 text-sm mt-2 font-semibold">Team capacity is optimally balanced.</p>
          </div>

          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%">
              <pattern id="grid1" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="2" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid1)" />
            </svg>
          </div>
        </motion.div>
      </section>

      {/* SECTION 2: WORKLOAD, COLLABORATION & ACTIVITY */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-[#0B0B0B] text-white rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 flex flex-col justify-between min-h-[240px] md:min-h-[320px] border-2 border-black"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-xl sm:text-2xl font-bold">Active workload</h3>
            <span className="text-xs border-2 border-white/20 px-3 py-1 rounded-full font-bold">Live</span>
          </div>

          <div className="space-y-4 my-6">
            <div className="flex justify-between items-center text-sm border-b-2 border-white/10 pb-3">
              <span className="text-white/60 font-semibold">Development</span>
              <span className="font-bold text-[#FF4D24]">14 Tasks</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b-2 border-white/10 pb-3">
              <span className="text-white/60 font-semibold">Creative & UI/UX</span>
              <span className="font-bold text-white">8 Tasks</span>
            </div>
            <div className="flex justify-between items-center text-sm pb-2">
              <span className="text-white/60 font-semibold">Product Marketing</span>
              <span className="font-bold text-white">4 Tasks</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-auto">
            <div className="flex -space-x-2">
              <img className="w-8 h-8 rounded-full border-2 border-black" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" alt="" />
              <img className="w-8 h-8 rounded-full border-2 border-black" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" alt="" />
              <img className="w-8 h-8 rounded-full border-2 border-black" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" alt="" />
            </div>
            <span className="text-xs text-white/60 font-semibold">8 contributors online</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2 bg-[#F4F4F4] rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 flex flex-col justify-between min-h-[280px] md:min-h-[320px] border-2 border-black/5"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-[#111111]">Upcoming Milestones</h3>
            <span className="text-sm font-bold text-[#FF4D24] cursor-pointer flex items-center gap-1 hover:underline">
              View Calendar <FiArrowUpRight />
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border-2 border-black/10 flex items-center gap-4">
              <div className="bg-[#FF4D24] text-white p-3 rounded-xl">
                <FiCalendar size={20} />
              </div>
              <div>
                <span className="text-xs text-[#FF4D24] font-bold">JULY 18, 2026</span>
                <h4 className="font-bold text-[#111111] text-sm md:text-base">Beta User Testing Phase</h4>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border-2 border-black/10 flex items-center gap-4">
              <div className="bg-black text-white p-3 rounded-xl">
                <FiClock size={20} />
              </div>
              <div>
                <span className="text-xs text-black/60 font-bold">AUGUST 05, 2026</span>
                <h4 className="font-bold text-[#111111] text-sm md:text-base">System Code Audit</h4>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-white rounded-xl border-2 border-black/10 flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span>Last repository sync occurred 4 minutes ago</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </div>
        </motion.div>
      </section>

      {/* SECTION 3: LIVE TIME TRACKER & WEEKLY METRICS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-[#0B0B0B] text-white rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 flex flex-col justify-between min-h-[260px] md:min-h-[340px] border-2 border-black"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs bg-white/10 px-3 py-1 rounded-full flex items-center gap-1.5 font-mono font-bold border border-white/10">
              <span className={`h-1.5 w-1.5 rounded-full ${isTracking ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></span>
              TRACKER
            </span>
            <span className="text-xs text-white/50 font-semibold">Task: #42-LandingPage</span>
          </div>

          <div className="my-auto text-center py-6">
            <span className="text-5xl md:text-6xl font-mono font-bold tracking-tight text-white block">
              {formatTime(time)}
            </span>
            <p className="text-xs text-white/40 mt-2 font-semibold">Active session running today</p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsTracking(!isTracking)}
              className={`w-full py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all duration-250 border-2 border-black ${
                isTracking 
                  ? 'bg-amber-500 text-black hover:bg-amber-400' 
                  : 'bg-[#FF4D24] text-white hover:bg-[#ff5d38]'
              }`}
            >
              {isTracking ? <FiPause size={18} /> : <FiPlay size={18} />}
              {isTracking ? 'Pause Focus' : 'Start Focus Timer'}
            </button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2 bg-[#F4F4F4] rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 flex flex-col justify-between min-h-[260px] md:min-h-[340px] border-2 border-black/5"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#111111]">Weekly Time Analytics</h3>
              <p className="text-sm text-gray-500 mt-1 font-semibold">Total capacity logged: 38.5 hrs</p>
            </div>
            <span className="bg-white border-2 border-black text-black text-xs font-bold px-3 py-1.5 rounded-full">
              Goal: 40h
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 items-end h-[140px] pt-4 px-2">
            {[
              { day: 'Mon', hrs: 8, active: false },
              { day: 'Tue', hrs: 9.5, active: false },
              { day: 'Wed', hrs: 6, active: false },
              { day: 'Thu', hrs: 8.5, active: true },
              { day: 'Fri', hrs: 6.5, active: false },
              { day: 'Sat', hrs: 0, active: false },
              { day: 'Sun', hrs: 0, active: false },
            ].map((bar, i) => (
              <div key={i} className="flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] font-bold text-gray-400 font-mono">{bar.hrs > 0 ? `${bar.hrs}h` : '-'}</span>
                <div 
                  style={{ height: `${(bar.hrs / 10) * 100}%` }}
                  className={`w-full rounded-t-lg transition-all duration-500 min-h-[4px] ${
                    bar.active 
                      ? 'bg-[#FF4D24]' 
                      : bar.hrs > 0 ? 'bg-black' : 'bg-black/10'
                  }`}
                ></div>
                <span className={`text-xs font-bold mt-1 ${bar.active ? 'text-[#FF4D24]' : 'text-gray-500'}`}>
                  {bar.day}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* SECTION 4: REAL-TIME FEED & UTILITY ACTIONS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2 bg-[#F4F4F4] rounded-[2rem] p-6 md:p-10 flex flex-col justify-between min-h-[250px] md:min-h-[300px] border-2 border-black/5"
        >
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#FF4D24] text-white rounded-lg border border-black"><FiActivity size={16} /></span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#111111]">Live Activity</h3>
              </div>
              <span className="text-xs text-gray-500 font-bold">{feedItems.length} new updates</span>
            </div>

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {feedItems.length > 0 ? (
                  feedItems.map((item) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="bg-white p-4 rounded-2xl border-2 border-black/10 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img className="w-9 h-9 rounded-full object-cover border-2 border-black/10" src={item.avatar} alt={item.user} />
                        <div className="text-sm">
                          <span className="font-bold text-black">{item.user}</span>{' '}
                          <span className="text-gray-500 font-medium">{item.action}</span>{' '}
                          <span className="font-mono text-xs bg-[#F4F4F4] px-2 py-0.5 rounded font-bold border border-black/10">{item.target}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 font-semibold">{item.time}</span>
                        <button 
                          onClick={() => markAsRead(item.id)}
                          className="p-1.5 bg-gray-100 hover:bg-[#FF4D24]/10 hover:text-[#FF4D24] text-gray-500 rounded-full transition-colors duration-200 border border-black/10"
                        >
                          <FiCheck size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-6 text-sm text-gray-400 font-semibold">
                    All caught up! No unread notifications.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-[#FF4D24] text-white rounded-[2rem] p-6 md:p-8 flex flex-col justify-between min-h-[250px] md:min-h-[300px] border-2 border-black"
        >
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">Quick <br />Actions</h3>
            <p className="text-white/70 text-sm mt-1 font-semibold">One-click utility shortcuts</p>
          </div>

          <div className="space-y-2 mt-6">
            <button className="w-full bg-white hover:bg-[#FFE500] text-black font-bold p-3 rounded-xl flex items-center justify-between text-sm transition-all duration-150 border-2 border-black">
              <span className="flex items-center gap-2"><FiPlus /> New Document</span>
              <FiCornerDownRight />
            </button>
            <button className="w-full bg-[#0B0B0B] hover:bg-black text-white font-bold p-3 rounded-xl flex items-center justify-between text-sm transition-all duration-150 border-2 border-black">
              <span className="flex items-center gap-2"><FiMessageSquare /> Invite Team Member</span>
              <FiCornerDownRight />
            </button>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
