import { Zap, Tag } from 'lucide-react';

const MatchCard = ({ title, confidence, description, active = false }: { title: string, confidence: string, description: string, active?: boolean }) => (
  <div className={`p-4 rounded-xl border transition-all cursor-pointer mb-3 ${active ? 'bg-primary-blue/10 border-primary-blue/50' : 'bg-surface-light/40 border-white/5 hover:border-white/10'}`}>
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-heading font-bold text-sm">{title}</h4>
      <span className={`text-[10px] font-bold ${active ? 'text-primary-blue' : 'text-primary-blue/60'}`}>{confidence}</span>
    </div>
    <p className="text-xs text-text-dim leading-normal">{description}</p>
  </div>
);

const AnalysisPanel = () => {
  return (
    <aside className="w-80 bg-surface-dark border-l border-border-subtle flex flex-col h-screen">
      {/* Tabs */}
      <div className="flex p-4 gap-2">
        <div className="flex-1 text-center py-2 text-[10px] font-bold text-white bg-white/10 rounded-lg cursor-pointer transition-all">
          ACTIVE RETRIEVAL
        </div>
        <div className="flex-1 text-center py-2 text-[10px] font-bold text-text-dim hover:text-white rounded-lg cursor-pointer transition-all">
          EXTRACTION QUEUE
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
        {/* Vectorization Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-widest opacity-60">Query Vectorization</h3>
            <Zap size={14} className="text-primary-blue" />
          </div>
          <div className="flex flex-wrap gap-2 px-1">
            {['Python', 'Optimization', 'Sorting'].map(tag => (
              <span key={tag} className="px-3 py-1.5 glass rounded-full text-xs text-text-dim hover:text-white cursor-pointer transition-all">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Top Matches Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-widest opacity-60">Top Matches</h3>
          </div>
          <MatchCard 
            title="Big O Analysis" 
            confidence="94%" 
            description="Complexity patterns for divide and conquer algorithms."
            active
          />
          <MatchCard 
            title="Array Mutation" 
            confidence="88%" 
            description="In-place sorting logic and memory efficiency."
          />
          <MatchCard 
            title="Pivot Theory" 
            confidence="81%" 
            description="Statistical distribution of random element picking."
          />
        </div>

        {/* New Pattern Section */}
        <div className="mt-auto pt-4 border-t border-border-subtle">
          <div className="flex items-center gap-2 mb-4 px-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-widest opacity-60">New Pattern Detected</h3>
          </div>
          
          <div className="p-4 bg-surface-light/40 border border-white/5 rounded-xl">
            <p className="text-xs text-text-dim leading-relaxed mb-4">
              Detected frequency: <span className="text-green-400 font-bold">Python</span> mentioned 3x recently.
            </p>
            <div className="flex items-center gap-2 p-3 glass rounded-lg mb-4 text-xs italic text-text-dim">
              <Tag size={12} />
              <span>Suggest: "PEP8 Formatting"</span>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2 glass rounded-lg text-xs font-bold text-green-400 hover:bg-green-400/10 cursor-pointer">
                Approve
              </button>
              <button className="flex-1 py-2 glass rounded-lg text-xs font-bold text-text-dim hover:bg-white/5 cursor-pointer">
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AnalysisPanel;
