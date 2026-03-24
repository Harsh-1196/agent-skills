import { useState, useEffect } from 'react';
import { Zap, Loader2 } from 'lucide-react';

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
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'retrieval' | 'queue'>('retrieval');

  const fetchCandidates = async () => {
    try {
      const res = await fetch("/api/patterns/candidates");
      const data = await res.json();
      setCandidates(data);
    } catch (e) {
      console.error("Failed to fetch candidates", e);
    }
  };

  useEffect(() => {
    fetchCandidates();
    const interval = setInterval(fetchCandidates, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (candidate: any) => {
    setLoading(true);
    try {
      await fetch("/api/patterns/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: candidate._id,
          name: candidate.intent_core,
          description: `Extracted from interaction: ${candidate.raw_query.substring(0, 30)}...`,
          trigger: candidate.intent_core.split(' ')[0], // Simple trigger extraction
          instructions: candidate.extracted_logic
        })
      });
      fetchCandidates();
    } catch (e) {
      console.error("Approval failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleIgnore = async (candidate: any) => {
    setLoading(true);
    try {
      await fetch("/api/patterns/ignore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidate._id })
      });
      fetchCandidates();
    } catch (e) {
      console.error("Ignore failed", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-80 bg-surface-dark border-l border-border-subtle flex flex-col h-screen">
      {/* Tabs */}
      <div className="flex p-4 gap-2">
        <div 
          onClick={() => setActiveTab('retrieval')}
          className={`flex-1 text-center py-2 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${activeTab === 'retrieval' ? 'text-white bg-white/10' : 'text-text-dim hover:text-white'}`}
        >
          ACTIVE RETRIEVAL
        </div>
        <div 
          onClick={() => setActiveTab('queue')}
          className={`flex-1 text-center py-2 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${activeTab === 'queue' ? 'text-white bg-white/10' : 'text-text-dim hover:text-white'}`}
        >
          EXTRACTION QUEUE ({candidates.length})
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
        {activeTab === 'retrieval' ? (
          <>
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
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {candidates.map(candidate => (
              <div key={candidate._id} className="p-4 bg-surface-light/40 border border-white/5 rounded-xl">
                 <div className="flex items-center justify-between mb-2">
                  <h4 className="font-heading font-bold text-sm text-primary-blue">{candidate.intent_core}</h4>
                  <span className="text-[8px] text-text-dim">{new Date(candidate.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-[11px] text-text-dim leading-relaxed mb-3 italic">
                  "{candidate.raw_query.substring(0, 60)}..."
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleApprove(candidate)}
                    disabled={loading}
                    className="flex-1 py-1.5 glass rounded-lg text-[10px] font-bold text-green-400 hover:bg-green-400/10 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={12} className="animate-spin mx-auto" /> : "Approve"}
                  </button>
                  <button 
                    onClick={() => handleIgnore(candidate)}
                    disabled={loading}
                    className="flex-1 py-1.5 glass rounded-lg text-[10px] font-bold text-text-dim hover:bg-white/5 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={12} className="animate-spin mx-auto" /> : "Ignore"}
                  </button>
                </div>
              </div>
            ))}
            {candidates.length === 0 && (
              <div className="text-center py-10 text-text-dim text-xs opacity-50">
                No new patterns in queue.
              </div>
            )}
          </div>
        )}

        {/* New Pattern Section (Global Alert) */}
        {candidates.length > 0 && activeTab === 'retrieval' && (
          <div className="mt-auto pt-4 border-t border-border-subtle">
            <div className="flex items-center gap-2 mb-4 px-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-widest opacity-60">New Pattern Detected</h3>
            </div>
            
            <div className="p-4 bg-primary-blue/5 border border-primary-blue/20 rounded-xl">
              <p className="text-xs text-text-dim leading-relaxed mb-4">
                The Monolith has identified <span className="text-primary-blue font-bold">{candidates.length}</span> potential new skills.
              </p>
              <button 
                onClick={() => setActiveTab('queue')}
                className="w-full py-2 glass rounded-lg text-xs font-bold text-primary-blue hover:bg-primary-blue/10 cursor-pointer"
              >
                Review Extraction Queue
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AnalysisPanel;
