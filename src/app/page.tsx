'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getHistory, getQuestionSets } from '@/lib/storage';
import { TestResult, QuestionSet } from '@/lib/disc-logic';
import { 
  LayoutDashboard, 
  ClipboardList, 
  PlusCircle, 
  Users, 
  Activity, 
  TrendingUp,
  History,
  ChevronRight,
  Settings
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [history, setHistory] = useState<TestResult[]>([]);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [h, q] = await Promise.all([getHistory(), getQuestionSets()]);
      setHistory(h);
      setQuestionSets(q);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return <div className="p-12 text-center text-muted-foreground">Loading dashboard...</div>;

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl">
            <LayoutDashboard size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-primary uppercase tracking-tight italic">HR Lab Dashboard</h1>
            <p className="text-muted-foreground text-lg">Behavioral metrics and assessment management.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => router.push('/admin')}
            className="px-6 py-3 rounded-xl bg-secondary font-bold hover:bg-secondary/80 transition-all border border-border flex items-center gap-2 group"
          >
            <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
            Questions
          </button>
          <button 
            onClick={() => router.push('/test')}
            className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:scale-105 transition-all shadow-lg flex items-center gap-2"
          >
            <PlusCircle size={18} />
            Start Test
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="glass p-8 rounded-3xl border border-white/20 shadow-xl flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center text-success shrink-0">
            <Users size={28} />
          </div>
          <div>
            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Assessments</span>
            <div className="text-3xl font-black text-foreground">{history.length}</div>
          </div>
        </div>
        <div className="glass p-8 rounded-3xl border border-white/20 shadow-xl flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <ClipboardList size={28} />
          </div>
          <div>
            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Question Sets</span>
            <div className="text-3xl font-black text-foreground">{questionSets.length}</div>
          </div>
        </div>
        <div className="glass p-8 rounded-3xl border border-white/20 shadow-xl bg-primary/5 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
            <TrendingUp size={28} />
          </div>
          <div>
            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Team Insight</span>
            <div className="text-sm font-bold leading-tight">Profiles optimized for leadership screening.</div>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
          <History className="text-primary" size={24} />
          Test History
        </h2>
        
        {history.length === 0 ? (
          <div className="glass p-12 rounded-3xl text-center border-dashed border-2 border-border flex flex-col items-center">
            <Activity size={48} className="text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg mb-6">No assessments taken yet.</p>
            <button 
              onClick={() => router.push('/test')} 
              className="px-8 py-4 bg-primary text-white rounded-2xl font-black flex items-center gap-3 hover:scale-105 transition-all shadow-xl"
            >
              <PlusCircle size={20} />
              START YOUR FIRST TEST
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {history.map((result) => (
              <div 
                key={result.id}
                onClick={() => router.push(`/result?id=${result.id}`)}
                className="glass p-5 rounded-2xl border border-white/20 hover:border-primary/50 cursor-pointer transition-all hover:scale-[1.01] shadow-sm select-none flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex flex-col">
                  <h3 className="text-xl font-black">{result.userName}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Behavioral Profile</p>
                    <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{new Date(result.date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex gap-1.5">
                    {(['D', 'I', 'S', 'C'] as const).map((trait) => {
                      const score = result.scores[trait] || 0;
                      return (
                        <div key={trait} className="flex flex-col items-center gap-1">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${score > 0 ? 'bg-success/10 text-success border border-success/20' : score < 0 ? 'bg-warning/10 text-warning border border-warning/20': 'bg-secondary/50 text-muted-foreground border border-border'}`}>
                            {trait}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="w-10 h-10 rounded-full bg-secondary/50 text-muted-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all transform group-hover:translate-x-1 shadow-sm shrink-0">
                    <ChevronRight size={20} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
