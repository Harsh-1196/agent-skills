import { 
  MessageSquare, 
  Library, 
  BarChart2, 
  Plus, 
  HelpCircle, 
  LogOut
} from 'lucide-react';

const NavItem = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${active ? 'bg-white/10 text-white' : 'text-text-dim hover:bg-white/5 hover:text-white'}`}>
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </div>
);

const RecentSession = ({ title, dots }: { title: string, dots: string[] }) => (
  <div className="group px-4 py-2 cursor-pointer rounded-lg hover:bg-white/5 transition-all">
    <p className="text-sm text-text-dim group-hover:text-text-bright transition-colors">{title}</p>
    <div className="flex gap-1 mt-1">
      {dots.map((color, i) => (
        <div key={i} className={`w-1.5 h-1.5 rounded-full ${color}`} />
      ))}
    </div>
  </div>
);

const Sidebar = () => {
  return (
    <aside className="w-72 bg-surface-dark border-r border-border-subtle flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-blue rounded-xl flex items-center justify-center glow-blue">
            <div className="w-5 h-5 bg-white rounded-sm rotate-45" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl leading-tight">Kaushal AI</h2>
            <p className="text-[10px] text-primary-blue font-bold tracking-widest uppercase opacity-80">AI Intelligence Layer</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-3 space-y-1">
        <p className="px-4 text-[10px] font-bold text-text-dim uppercase tracking-wider mb-2 opacity-50">Main</p>
        <NavItem icon={MessageSquare} label="Sessions" active />
        <NavItem icon={Library} label="Library" />
        <NavItem icon={BarChart2} label="Stats" />
      </div>

      {/* Recent Sessions */}
      <div className="px-3 mt-8 flex-1 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-[10px] font-bold text-text-dim uppercase tracking-wider mb-2 opacity-50">Recent Sessions</p>
        <RecentSession title="Neural Architecture" dots={['bg-blue-400', 'bg-green-400']} />
        <RecentSession title="Vector DB Scaling" dots={['bg-purple-400']} />
        <RecentSession title="Recursive Logic" dots={['bg-green-400', 'bg-blue-400', 'bg-purple-400']} />
      </div>

      {/* Footer Actions */}
      <div className="p-4 space-y-4">
        <button className="w-full py-3 bg-gradient-to-r from-primary-blue to-accent-purple rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          <Plus size={18} />
          <span>New Session</span>
        </button>

        <div className="pt-4 border-t border-border-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider opacity-50">Skills</p>
              <p className="text-lg font-bold">14</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider opacity-50">Growth</p>
              <p className="text-lg font-bold text-green-400">+42</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2 text-text-dim">
              <HelpCircle size={20} className="cursor-pointer hover:text-white" />
              <LogOut size={20} className="cursor-pointer hover:text-white" />
            </div>
            <div className="flex-1" />
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-blue/30 p-0.5">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
