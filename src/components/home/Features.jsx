import React from 'react';
import { motion } from 'framer-motion';
import { 
  FiGitBranch, 
  FiLayers, 
  FiTerminal, 
  FiShield, 
  FiZap, 
  FiRepeat,
  FiArrowUpRight 
} from 'react-icons/fi';

export default function Features() {
  return (
    <section className="lg:mt-40 w-full max-w-340 mx-auto p-6 md:p-10 bg-white">
      
      {/* Section Header */}
      <div className="mb-12 max-w-2xl">
        <span className="inline-block px-3 py-1 bg-[#FF4D24]/10 border border-[#FF4D24]/20 rounded-full text-xs font-bold text-[#FF4D24] mb-4">
          Core Engine
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#111111] tracking-tight leading-tight">
          Built for teams that move exceptionally fast.
        </h2>
        <p className="text-gray-500 mt-4 text-sm sm:text-lg">
          No complex submenus, configuration bloat, or slow loading times. Just raw velocity and clean coordination.
        </p>
      </div>

      {/* Features Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Feature 1: Git Branching Integrations */}
        <motion.div 
          whileHover={{ y: -6 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="bg-[#F4F4F4] border-2 border-transparent hover:border-[#111111] rounded-[2rem] p-6 md:p-8 flex flex-col justify-between min-h-[240px] md:min-h-[280px] transition-all duration-200"
        >
          <div className="bg-white text-[#FF4D24] p-3 md:p-4 rounded-2xl w-12 md:w-14 h-12 md:h-14 flex items-center justify-center border-2 border-black/5 shadow-sm">
            <FiGitBranch size={20} />
          </div>
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-[#111111]">Branch-Linked Tasks</h3>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              Auto-resolve, assign, or transition your backlog sprints straight from local Git branches and commit messages.
            </p>
          </div>
        </motion.div>

        {/* Feature 2: High-Contrast "Fast Action" Center (Highlight Card) */}
        <motion.div 
          whileHover={{ y: -6 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="bg-[#FF4D24] text-white rounded-[2rem] p-6 md:p-8 flex flex-col justify-between min-h-[240px] md:min-h-[280px] relative overflow-hidden"
        >
          <div className="bg-white/15 p-3 md:p-4 rounded-2xl w-12 md:w-14 h-12 md:h-14 flex items-center justify-center">
            <FiZap size={20} className="text-[#FFE500]" />
          </div>
          <div className="mt-8 z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FFE500]">0.4ms Latency</span>
            <h3 className="text-2xl font-bold mt-1">Instant Keyboard Workflows</h3>
            <p className="text-white/80 text-sm mt-2 leading-relaxed">
              Command-menu driven controls allow you to jump screens, assign hotkeys, and batch-edit states instantly.
            </p>
          </div>
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%">
              <pattern id="feat-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <rect width="30" height="30" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#feat-grid)" />
            </svg>
          </div>
        </motion.div>

        {/* Feature 3: Realtime Engine */}
        <motion.div 
          whileHover={{ y: -6 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="bg-[#F4F4F4] border-2 border-transparent hover:border-[#111111] rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 flex flex-col justify-between min-h-[240px] md:min-h-[280px] transition-all duration-200"
        >
          <div className="bg-white text-black p-3 md:p-4 rounded-2xl w-12 md:w-14 h-12 md:h-14 flex items-center justify-center border-2 border-black/5 shadow-sm">
            <FiRepeat size={20} />
          </div>
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-[#111111]">CRDT Multi-player</h3>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              Every card position, document, edit, and focus clock is synchronized dynamically across your entire workspace.
            </p>
          </div>
        </motion.div>

        {/* Feature 4: Custom Automation Pipelines */}
        <motion.div 
          whileHover={{ y: -6 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="bg-[#F4F4F4] border-2 border-transparent hover:border-[#111111] rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 flex flex-col justify-between min-h-[240px] md:min-h-[280px] transition-all duration-200 lg:col-span-2"
        >
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center justify-between">
            <div className="bg-white text-black p-3 md:p-4 rounded-2xl w-12 md:w-14 h-12 md:h-14 flex items-center justify-center border-2 border-black/5 shadow-sm shrink-0">
              <FiTerminal size={20} strokeWidth={2.5} />
            </div>
            <div className="bg-black text-green-400 font-mono text-[11px] p-3 rounded-xl border border-white/20 w-full md:w-auto">
              <span className="text-white/40">on:</span> issue.labeled('blocker') <br />
              <span className="text-white/40">run:</span> notify_team_slack()
            </div>
          </div>
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-[#111111]">Logic Automation Engine</h3>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed max-w-2xl">
              Construct flexible trigger-action chains without write-ups. Automatically alert engineering channels on Slack, adjust priority levels, or escalate backlogs effortlessly.
            </p>
          </div>
        </motion.div>

        {/* Feature 5: Security / Isolation */}
        <motion.div 
          whileHover={{ y: -6 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="bg-[#0B0B0B] text-white rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 flex flex-col justify-between min-h-[240px] md:min-h-[280px] transition-all duration-200"
        >
          <div className="bg-white/10 text-white p-3 md:p-4 rounded-2xl w-12 md:w-14 h-12 md:h-14 flex items-center justify-center border border-white/15">
            <FiShield size={20} />
          </div>
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-white">Fortified Sandboxes</h3>
            <p className="text-white/60 text-sm mt-2 leading-relaxed">
              Full data isolation, SOC2 Type II compliance standards, and custom role controls built directly into your root infrastructure.
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
