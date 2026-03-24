import React from 'react';
import { Settings, Shield } from 'lucide-react';

const TopHeader: React.FC = () => {
  return (
    <header className="absolute top-0 left-0 right-0 h-16 w-full flex items-center justify-between px-8 z-20 font-mono bg-black/40 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center gap-4 h-full">
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-primary-accent)] font-bold tracking-widest text-lg">Chanakya-AI</span>
          <span className="text-gray-500 mx-2">|</span>
          <span className="text-gray-400 text-xs tracking-widest">CORE_INTERFACE</span>
        </div>
      </div>

      <div className="flex items-center gap-12 text-[10px] tracking-widest uppercase font-semibold">
        <div className="flex items-center gap-3 hidden sm:flex">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-accent)] shadow-[0_0_8px_#00F0FF]"></div>
          <span className="text-[var(--color-primary-accent)]">Synapse_Load: 24%</span>
        </div>
        <div className="flex items-center gap-3 text-gray-400 hidden sm:flex">
          <Shield className="w-3 h-3" />
          <span>Encryption_Layer: AES-256</span>
        </div>
      </div>

      <div className="flex items-center gap-6 text-gray-400">
        <Settings className="w-4 h-4 hover:text-[var(--color-primary-accent)] cursor-pointer transition-colors" />
        <Shield className="w-4 h-4 hover:text-[var(--color-primary-accent)] cursor-pointer transition-colors" />
      </div>
    </header>
  );
};
export default TopHeader;
