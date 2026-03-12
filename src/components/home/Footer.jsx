import React from 'react';
import { FiGithub, FiTwitter, FiLinkedin, FiArrowRight, FiCommand } from 'react-icons/fi';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full max-w-340 mx-auto p-6 md:p-10 mt-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 border-t-4 border-gray-200 pt-12">
        
        <div className="lg:col-span-2 flex flex-col justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="p-2 bg-[#FF4D24] text-white rounded-xl">
                <FiCommand size={24} />
              </span>
              <span className="text-2xl font-black text-[#111111] tracking-tight">
                Collabora8r
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-[#111111] tracking-tight leading-none max-w-xl">
              Ready to build at{' '}
              <span className="text-[#FF4D24]">breakneck speed?</span>
            </h2>
          </div>

          <div className="max-w-md">
            <p className="text-sm font-bold text-gray-500 mb-3">
              Get raw product updates (no marketing fluff)
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="email" 
                placeholder="you@domain.com" 
                className="w-full px-5 py-3 border-2 border-gray-300 rounded-full font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D24] bg-[#F4F4F4] text-black placeholder-gray-400"
              />
              <button className="px-6 py-3 bg-black hover:bg-[#FF4D24] hover:text-white text-white font-bold rounded-full text-sm transition-all duration-200 shrink-0 flex items-center justify-center gap-2">
                Join <FiArrowRight />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#F4F4F4] rounded-[2rem] p-8 border-2 border-gray-200 hover:border-[#FF4D24] transition-colors duration-200 grid grid-cols-2 gap-8">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">
              Engine
            </h4>
            <ul className="space-y-2.5">
              {['Features', 'Changelog', 'Integrations', 'Pricing', 'Security'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm font-bold text-[#111111] hover:text-[#FF4D24] transition-colors duration-150">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">
              Resources
            </h4>
            <ul className="space-y-2.5">
              {['Docs', 'Community', 'Guides', 'Status', 'Compare'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm font-bold text-[#111111] hover:text-[#FF4D24] transition-colors duration-150">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mt-12 pt-6 border-t border-gray-200 text-xs text-gray-500 font-semibold">
        <div className="flex items-center gap-4">
          <span>&copy; {currentYear} Collabora8r. All rights reserved.</span>
          <span className="hidden md:inline text-gray-300">|</span>
          <a href="#" className="hover:text-black transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-black transition-colors">Terms of Service</a>
        </div>

        <div className="flex items-center gap-2 bg-[#F4F4F4] px-4 py-2 rounded-full border border-gray-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-black">
            All Systems Operational (99.98%)
          </span>
        </div>

        <div className="flex items-center gap-4">
          <a href="#" className="p-2.5 bg-[#F4F4F4] border border-gray-200 hover:border-[#FF4D24] rounded-full text-black transition-all duration-150">
            <FiTwitter size={16} />
          </a>
          <a href="#" className="p-2.5 bg-[#F4F4F4] border border-gray-200 hover:border-[#FF4D24] rounded-full text-black transition-all duration-150">
            <FiGithub size={16} />
          </a>
          <a href="#" className="p-2.5 bg-[#F4F4F4] border border-gray-200 hover:border-[#FF4D24] rounded-full text-black transition-all duration-150">
            <FiLinkedin size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
}
