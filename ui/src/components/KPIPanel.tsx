import React from 'react';
import { RefreshCw } from 'lucide-react';

const KPIPanel: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 font-mono">
      {/* Box 1 */}
      <div className="bg-[#12121a] border-l-2 border-white/20 p-4 relative group hover:bg-[#161622] transition-colors">
        <div className="text-[10px] text-gray-500 mb-2 tracking-widest uppercase">Memory Allocation</div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-100">1.2TB</span>
          <span className="text-xs text-gray-400">Active</span>
        </div>
      </div>

      {/* Box 2 */}
      <div className="bg-[#12121a] border-l-2 border-purple-500 p-4 relative group hover:bg-[#161622] transition-colors">
        <div className="text-[10px] text-gray-500 mb-2 tracking-widest uppercase">System State</div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-purple-400 italic uppercase" style={{ textShadow: '0 0 10px rgba(168, 85, 247, 0.4)' }}>
            UPDATING
          </span>
          <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
        </div>
      </div>

      {/* Box 3 */}
      <div className="bg-[#12121a] border-l-2 border-[#00F0FF] p-4 relative group hover:bg-[#161622] transition-colors">
        <div className="text-[10px] text-gray-500 mb-2 tracking-widest uppercase">Neural Load</div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-100">84.2%</span>
        </div>
      </div>
    </div>
  );
};

export default KPIPanel;
