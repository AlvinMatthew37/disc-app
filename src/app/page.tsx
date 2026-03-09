'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getHistory, getQuestionSets } from '@/lib/storage';
import { TestResult, QuestionSet } from '@/lib/disc-logic';

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
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gradient">HR Psychology Dashboard</h1>
          <p className="text-muted-foreground text-lg">Manage assessments and view insights for your team.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => router.push('/admin')}
            className="px-6 py-3 rounded-xl bg-secondary font-bold hover:bg-secondary/80 transition-all border border-border"
          >
            Manage Questions
          </button>
          <button 
            onClick={() => router.push('/test')}
            className="px-6 py-3 rounded-xl grad-primary text-white font-bold hover:scale-105 transition-all shadow-lg"
          >
            Take New Test
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="glass p-8 rounded-3xl border border-white/20 shadow-xl">
          <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Assessments</span>
          <div className="text-5xl font-black mt-2 text-primary">{history.length}</div>
        </div>
        <div className="glass p-8 rounded-3xl border border-white/20 shadow-xl">
          <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Available Sets</span>
          <div className="text-5xl font-black mt-2 text-primary">{questionSets.length}</div>
        </div>
        <div className="glass p-8 rounded-3xl border border-white/20 shadow-xl bg-primary/5">
          <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Quick Insight</span>
          <div className="text-lg font-bold mt-2 leading-tight">Ready for analysis of your behavioral profile.</div>
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
          <span className="w-2 h-8 grad-primary rounded-full" />
          Recent Test History
        </h2>
        
        {history.length === 0 ? (
          <div className="glass p-12 rounded-3xl text-center border-dashed border-2 border-border">
            <p className="text-muted-foreground text-lg mb-6">No assessments taken yet.</p>
            <button onClick={() => router.push('/test')} className="text-primary font-black hover:underline underline-offset-4">START YOUR FIRST TEST →</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((result) => (
              <div 
                key={result.id}
                onClick={() => router.push(`/result?id=${result.id}`)}
                className="glass p-6 rounded-3xl border border-white/20 hover:border-primary/50 cursor-pointer transition-all hover:scale-[1.02] shadow-sm select-none"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold text-muted-foreground">{new Date(result.date).toLocaleDateString()}</span>
                  <div className="flex gap-1">
                    {(['D', 'I', 'S', 'C'] as const).map((trait) => {
                      const score = result.scores[trait] || 0;
                      return (
                        <span key={trait} className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${score > 0 ? 'bg-primary/10 text-primary' : score < 0 ? 'bg-warning/10 text-warning': 'bg-secondary text-muted-foreground'}`}>
                          {trait}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <h3 className="text-xl font-black mb-1">{result.userName}</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">Behavioral Profile</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
