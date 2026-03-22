import React from 'react';
import { Hexagon, Users, Network, Lock, Settings, FileText, HelpCircle } from 'lucide-react';

const Sidebar: React.FC = () => {
  return (
    <div className="w-64 h-full bg-[#0a0a0f] border-r border-white/5 flex flex-col pt-6 font-mono hidden md:flex">
      {/* Brand */}
      <div className="px-6 mb-10">
        <h1 className="text-[var(--color-primary-accent)] font-bold text-xl tracking-wider mb-1">NEURAL_MONOLITH</h1>
        <div className="text-[10px] text-[var(--color-primary-accent)]/70 tracking-widest uppercase">
          Status: Synchronized
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        <div className="group flex items-center gap-4 px-6 py-3 cursor-pointer bg-gradient-to-r from-[var(--color-primary-accent)]/10 to-transparent border-l-2 border-[var(--color-primary-accent)]">
          <Hexagon className="w-5 h-5 text-[var(--color-primary-accent)] fill-[var(--color-primary-accent)]/20" />
          <span className="text-[var(--color-primary-accent)] text-sm font-semibold tracking-wider">NEURAL HUB</span>
        </div>

        {[
          { icon: Users, label: 'AGENT FLEET' },
          { icon: Network, label: 'LOGIC STREAMS' },
          { icon: Lock, label: 'VAULT' },
          { icon: Settings, label: 'SETTINGS' },
        ].map((item) => (
          <div key={item.label} className="group flex items-center gap-4 px-6 py-3 cursor-pointer hover:bg-white/5 transition-colors border-l-2 border-transparent">
            <item.icon className="w-5 h-5 text-gray-500 group-hover:text-gray-300" />
            <span className="text-gray-400 group-hover:text-gray-200 text-sm font-medium tracking-wider">{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-6">
        <button className="w-full bg-[var(--color-primary-accent)] text-black font-bold text-sm tracking-wider py-3 rounded-sm mb-6 hover:bg-cyan-300 transition-colors shadow-[0_0_15px_rgba(0,245,255,0.3)] hover:shadow-[0_0_25px_rgba(0,245,255,0.5)]">
          DEPLOY NEW AGENT
        </button>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-gray-500 hover:text-gray-300 cursor-pointer transition-colors text-xs">
            <FileText className="w-4 h-4" />
            <span className="tracking-wider">DOCS</span>
          </div>
          <div className="flex items-center gap-3 text-gray-500 hover:text-gray-300 cursor-pointer transition-colors text-xs">
            <HelpCircle className="w-4 h-4" />
            <span className="tracking-wider">SUPPORT</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
