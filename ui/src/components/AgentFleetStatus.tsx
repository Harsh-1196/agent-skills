import React from 'react';
import { Cpu, Activity, Network } from 'lucide-react';

const AgentFleetStatus: React.FC = () => {
  return (
    <div className="bg-[#0a0a0f] border border-white/5 p-5 font-mono mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white font-bold tracking-widest text-sm uppercase">Agent Fleet Status</h3>
        <div className="flex gap-1">
          {[1,2,3,4].map(i => <div key={i} className="w-1 h-1 bg-gray-500 rounded-sm" />)}
        </div>
      </div>

      <div className="space-y-4">
        {/* Unit 1 */}
        <div className="bg-[#12121a] p-3 border border-white/5 relative group hover:bg-[#161622] transition-colors">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-[#00F0FF]/10 text-[var(--color-primary-accent)] flex items-center justify-center rounded-sm">
                <Cpu className="w-3 h-3" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-200 tracking-wider">ALPHA_UNIT</div>
                <div className="text-[10px] text-gray-400">SYNTHESIZING</div>
              </div>
            </div>
            <div className="text-xs text-[var(--color-primary-accent)] font-bold">88%</div>
          </div>
          <div className="h-1 mt-2 w-full bg-black/50">
            <div className="h-full bg-[var(--color-primary-accent)] w-[88%] shadow-[0_0_10px_#00F0FF]" />
          </div>
        </div>

        {/* Unit 2 */}
        <div className="bg-[#12121a] p-3 border border-white/5 relative group hover:bg-[#161622] transition-colors">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-[#A855F7]/10 text-[#A855F7] flex items-center justify-center rounded-sm">
                <Activity className="w-3 h-3" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-200 tracking-wider">BETA_NODE</div>
                <div className="text-[10px] text-gray-400">REASONING</div>
              </div>
            </div>
            <div className="text-xs text-[#A855F7] font-bold">42%</div>
          </div>
          <div className="h-1 mt-2 w-full bg-black/50">
            <div className="h-full bg-[#A855F7] w-[42%] shadow-[0_0_10px_#A855F7]" />
          </div>
        </div>

        {/* Unit 3 */}
        <div className="bg-[#12121a] p-3 border border-white/5 relative group hover:bg-[#161622] transition-colors flex items-center opacity-60">
          <div className="flex justify-between items-center mb-1 w-full">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-500/10 text-gray-500 flex items-center justify-center rounded-sm">
                <Network className="w-3 h-3" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 tracking-wider">GAMMA_FLOW</div>
                <div className="text-[10px] text-gray-500">IDLE</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 font-bold">0%</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AgentFleetStatus;
