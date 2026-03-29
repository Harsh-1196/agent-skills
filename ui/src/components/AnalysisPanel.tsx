import { useState, useEffect } from 'react';
import { Zap, Loader2, ChevronDown, ChevronUp, Clock, BrainCircuit, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SkillMatch {
  skill: string;
  score: number;
}

function getScoreColor(score: number) {
  if (score >= 0.80) return { bar: 'bg-green-400', text: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30' };
  if (score >= 0.60) return { bar: 'bg-amber-400', text: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' };
  return { bar: 'bg-red-400', text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30' };
}

const MatchCard = ({ skill, score, index }: { skill: string, score: number, index: number }) => {
  const colors = getScoreColor(score);
  const percentage = Math.round(score * 100);
  const isTop = index === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={`p-4 rounded-xl border transition-all cursor-pointer mb-3 ${isTop ? `${colors.bg} ${colors.border}` : 'bg-surface-light/40 border-white/5 hover:border-white/10'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-heading font-bold text-sm text-text-bright">{skill}</h4>
        <span className={`text-[10px] font-bold ${colors.text}`}>{percentage}%</span>
      </div>
      {/* Score bar */}
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: index * 0.15, ease: 'easeOut' }}
          className={`h-full rounded-full ${colors.bar}`}
          style={{ boxShadow: `0 0 8px currentColor` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-text-dim uppercase tracking-widest">
          {score >= 0.80 ? 'HIGH CONFIDENCE' : score >= 0.60 ? 'MEDIUM CONFIDENCE' : 'LOW CONFIDENCE'}
        </span>
      </div>
    </motion.div>
  );
};

interface AnalysisPanelProps {
  keywords?: string[];
  skillMatches?: SkillMatch[];
}

const AnalysisPanel = ({ keywords = [], skillMatches = [] }: AnalysisPanelProps) => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'retrieval' | 'queue'>('retrieval');
  const [insightsExpanded, setInsightsExpanded] = useState(false);

  // Auto-expand when matches arrive
  useEffect(() => {
    if (skillMatches.length > 0) {
      setInsightsExpanded(true);
      setActiveTab('retrieval');
    }
  }, [skillMatches]);

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
    const interval = setInterval(fetchCandidates, 10000);
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
          description: candidate.intent_core + (candidate.extracted_logic ? '. ' + candidate.extracted_logic : ''),
          trigger: candidate.intent_core,
          instructions: candidate.extracted_logic || candidate.intent_core,
          raw_query: candidate.raw_query || ''
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
            {/* Skill Insights Collapsible Header */}
            <button
              onClick={() => setInsightsExpanded(!insightsExpanded)}
              className="w-full flex items-center justify-between mb-4 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${skillMatches.length > 0 || keywords.length > 0 ? 'bg-green-400 animate-pulse' : 'bg-text-dim/30'}`} />
                <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Skill Insights</h3>
              </div>
              {insightsExpanded ? <ChevronUp size={14} className="text-text-dim" /> : <ChevronDown size={14} className="text-text-dim" />}
            </button>

            <AnimatePresence>
              {insightsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  {/* Section A: Query Vectorization (Keywords) */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3 px-2">
                      <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-widest opacity-60">Query Vectorization</h3>
                      <Zap size={14} className="text-primary-blue" />
                    </div>
                    <div className="flex flex-wrap gap-2 px-1">
                      {keywords.length > 0 ? keywords.map(tag => (
                        <motion.span
                          key={tag}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="px-3 py-1.5 glass rounded-full text-xs text-text-dim hover:text-white cursor-pointer transition-all"
                        >
                          {tag}
                        </motion.span>
                      )) : (
                        <span className="text-[10px] text-text-dim/40 italic px-2">Submit a query to see keywords...</span>
                      )}
                    </div>
                  </div>

                  {/* Section B: Top Matches */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3 px-2">
                      <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-widest opacity-60">Top Matches</h3>
                      {skillMatches.length > 0 && (
                        <span className="text-[9px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                          {skillMatches.length} found
                        </span>
                      )}
                    </div>
                    {skillMatches.length > 0 ? skillMatches.map((match, index) => (
                      <MatchCard
                        key={match.skill}
                        skill={match.skill}
                        score={match.score}
                        index={index}
                      />
                    )) : (
                      <div className="text-center py-6 text-text-dim text-xs opacity-40">
                        No skill matches yet.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* New Pattern Section */}
            {candidates.length > 0 && (
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
          </>
        ) : (
          <div className="space-y-4">
            {candidates.map((candidate, index) => (
              <motion.div
                key={candidate._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                className="group relative rounded-2xl overflow-hidden"
              >
                {/* Gradient accent border */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-purple/20 via-primary-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative p-5 bg-surface-light/30 border border-white/[0.06] rounded-2xl hover:border-white/[0.12] transition-all duration-300">
                  {/* Header: Intent + Timestamp */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-accent-purple/15 border border-accent-purple/20 flex items-center justify-center shrink-0">
                        <BrainCircuit size={15} className="text-accent-purple" />
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-[13px] text-text-bright leading-tight">{candidate.intent_core}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock size={9} className="text-text-dim/50" />
                          <span className="text-[9px] text-text-dim/50 font-mono">
                            {new Date(candidate.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Sparkles size={14} className="text-accent-purple/40 mt-1" />
                  </div>

                  {/* Extracted Logic */}
                  {candidate.extracted_logic && (
                    <div className="mb-3 p-3 rounded-xl bg-black/20 border border-white/[0.04]">
                      <p className="text-[11px] text-text-dim/80 leading-relaxed font-medium">
                        {candidate.extracted_logic.substring(0, 120)}{candidate.extracted_logic.length > 120 ? '...' : ''}
                      </p>
                    </div>
                  )}

                  {/* Raw Query Preview */}
                  <div className="mb-3 flex items-start gap-2">
                    <span className="text-[9px] text-text-dim/40 uppercase tracking-widest font-bold shrink-0 mt-0.5">Query</span>
                    <p className="text-[11px] text-text-dim/60 leading-relaxed">
                      {candidate.raw_query.substring(0, 80)}{candidate.raw_query.length > 80 ? '...' : ''}
                    </p>
                  </div>

                  {/* Style Markers */}
                  {candidate.style_markers && candidate.style_markers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {candidate.style_markers.slice(0, 3).map((marker: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-primary-blue/8 border border-primary-blue/15 text-[9px] font-medium text-primary-blue/70">
                          {marker}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleApprove(candidate)}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-400/8 border border-green-400/15 text-[11px] font-bold text-green-400 hover:bg-green-400/15 hover:border-green-400/30 hover:shadow-[0_0_16px_rgba(74,222,128,0.1)] transition-all duration-300 cursor-pointer disabled:opacity-40"
                    >
                      {loading ? <Loader2 size={13} className="animate-spin" /> : <><CheckCircle size={13} /> Approve</>}
                    </button>
                    <button 
                      onClick={() => handleIgnore(candidate)}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] font-bold text-text-dim/60 hover:bg-red-400/8 hover:border-red-400/15 hover:text-red-400 hover:shadow-[0_0_16px_rgba(248,113,113,0.08)] transition-all duration-300 cursor-pointer disabled:opacity-40"
                    >
                      {loading ? <Loader2 size={13} className="animate-spin" /> : <><XCircle size={13} /> Ignore</>}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            {candidates.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                  <BrainCircuit size={20} className="text-text-dim/20" />
                </div>
                <p className="text-xs text-text-dim/40 font-medium">No patterns in queue</p>
                <p className="text-[10px] text-text-dim/25 mt-1">New patterns will appear here as you chat</p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default AnalysisPanel;
