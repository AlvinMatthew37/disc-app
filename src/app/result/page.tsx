'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { TestResult, Trait } from '@/lib/disc-logic';
import { getResultById } from '@/lib/storage';
import { formatAnalysisText, generateAnalysis } from './ai-report';
import { ChevronLeft, LayoutDashboard, BrainCircuit, RotateCcw } from 'lucide-react';

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<TestResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    async function loadResult() {
      const id = searchParams?.get('id');
      if (id) {
        const found = await getResultById(id);
        setResult(found);
        if (found?.report) {
          setAiAnalysis(found.report);
        }
      }
    }
    loadResult();
  }, [searchParams]);

  // Trigger automatic generation if report is missing
  useEffect(() => {
    if (result && !result.report && !aiAnalysis && !generating && !aiError) {
      handleGenerateAnalysis();
    }
  }, [result, aiAnalysis, generating, aiError]);

  if (!result) return <div className="p-12 text-center text-muted-foreground">Loading result...</div>;

  const rawScores = result.scores;
  const traits: { key: Trait; label: string; desc: string }[] = [
    { key: 'D', label: 'Dominance', desc: 'Direct, results-oriented, and decisive.' },
    { key: 'I', label: 'Influence', desc: 'Outgoing, enthusiastic, and optimistic.' },
    { key: 'S', label: 'Steadfastness', desc: 'Patient, loyal, and supportive.' },
    { key: 'C', label: 'Conscientiousness', desc: 'Analytical, precise, and systematic.' },
  ];

  // Scoring in DISC Most/Least can go from -N to +N where N is number of sets.
  // We'll normalize to a 0-100 scale for the graph.
  // Assume a reasonable max possible score is 15-20 for a typical test, 
  // but we should scale relative to the sets actually taken.
  // For simplicity, we'll use a fixed range or dynamic based on result.
  const allValues = Object.values(rawScores);
  const maxAbs = Math.max(...allValues.map(Math.abs), 1);
  // Round up to nearest nice number (e.g., 5, 10, 15, 20)
  const scaleLimit = Math.max(Math.ceil(maxAbs / 5) * 5, 5);
  
  // Generate labels (roughly 9-11 labels)
  const step = scaleLimit / 5;
  const yLabels: number[] = [];
  for (let i = scaleLimit; i >= -scaleLimit; i -= step) {
    yLabels.push(i);
  }

  const maxTrait = traits.reduce((prev, current) => 
    (rawScores[current.key] > rawScores[prev.key]) ? current : prev
  );

  async function handleGenerateAnalysis() {
    if (!result) return;
    await generateAnalysis(result, rawScores, setGenerating, setAiError, setAiAnalysis);
  }

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={() => router.push('/')}
          className="px-5 py-2.5 rounded-lg bg-secondary text-sm font-bold hover:bg-secondary/80 transition-all border border-border flex items-center gap-2 group"
        >
          <ChevronLeft size={18} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
          <LayoutDashboard size={16} />
          DASHBOARD
        </button>
        <div className="text-right">
          <h1 className="text-2xl font-black text-primary italic">Assessment Result</h1>
          <p className="text-xs text-muted-foreground">Position Analysis for <span className="text-foreground font-semibold underline decoration-primary decoration-2">{result.userName}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Visualization (Takes 9/12) */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          <div className="relative w-full bg-white p-6 rounded-2xl shadow-xl border border-border">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-[#1a2d4d]">Assessment Profile</h3>
            </div>
            
            <div className="relative h-[380px] w-full bg-white">
              {/* SVG for Grid, Labels, and Data */}
              <svg viewBox="-60 0 860 460" className="absolute inset-0 w-full h-full overflow-visible">
                {/* Y-Axis Labels & Horizontal Grid Lines */}
                {yLabels.map((v) => {
                  const y = 200 - (v / scaleLimit) * 200;
                  return (
                    <g key={v}>
                      {/* Label */}
                      <text 
                        x="-10" 
                        y={y} 
                        textAnchor="end" 
                        alignmentBaseline="middle" 
                        className="text-[10px] font-bold fill-muted-foreground"
                      >
                        {v.toFixed(1)}
                      </text>
                      {/* Line */}
                      <line 
                        x1="0" y1={y} x2="800" y2={y} 
                        stroke={v === 0 ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.05)"} 
                        strokeWidth={v === 0 ? "2" : "1"} 
                      />
                    </g>
                  );
                })}
                
                {/* Vertical Grid Lines */}
                {traits.map((_, i) => {
                  const x = 100 + i * 200;
                  return (
                    <line 
                      key={i} 
                      x1={x} y1="0" x2={x} y2="400" 
                      stroke="rgba(0,0,0,0.05)" 
                      strokeWidth="1" 
                    />
                  );
                })}

                {/* Left and Bottom Axis Lines */}
                <line x1="0" y1="0" x2="0" y2="400" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
                <line x1="0" y1="400" x2="800" y2="400" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />

                {/* Bottom Labels (D I S C) - aligned to grid */}
                {traits.map((t, i) => {
                  const x = 100 + i * 200;
                  return (
                    <g key={`label-${t.key}`}>
                      <text x={x} y="430" textAnchor="middle" className="text-[14px] font-black fill-[#1a2d4d]">
                        {t.key}
                      </text>
                      <text x={x} y="450" textAnchor="middle" className="text-[10px] font-bold fill-muted-foreground">
                        ({rawScores[t.key]})
                      </text>
                    </g>
                  );
                })}

                {(() => {
                  const points = traits.map((t, i) => {
                    const x = 100 + i * 200;
                    const rawScore = rawScores[t.key];
                    const y = 200 - (rawScore / scaleLimit) * 200; 
                    return { x, y };
                  });
                  const d = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
                  return (
                    <>
                      <path d={d} fill="none" stroke="#969696ff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                      {points.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="8" fill="#908b13" />
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column: Breakdown & Detail (Takes 3/12) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="glass p-6 rounded-[28px] border-l-12 border-l-primary shadow-xl">
            <h2 className="text-xl font-black mb-2 text-[#1a2d4d]">Primary Style: {maxTrait.label}</h2>
            <p className="text-base text-muted-foreground leading-relaxed italic">{maxTrait.desc}</p>
          </div>

          <div className="flex flex-col gap-2">
            {traits.map((t) => (
              <div key={t.key} className="p-3 rounded-xl bg-[#f2f4f7] border border-border shadow-inner flex items-center gap-3 group hover:bg-white transition-colors">
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-lg bg-white text-[#1a2d4d] shadow-sm group-hover:scale-110 transition-transform shrink-0`}>
                  {t.key}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{t.label}</span>
                  <span className={`text-xl font-black ${rawScores[t.key]>0? 'text-success' : rawScores[t.key]<0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {rawScores[t.key] > 0 ? `+${rawScores[t.key]}` : rawScores[t.key]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Behavioral Analysis - Full Width Center */}
      <div className="mt-10 flex flex-col gap-5">
        <h3 className="text-xl font-black text-[#1a2d4d] flex items-center gap-3 justify-center uppercase tracking-widest italic">
          <BrainCircuit className="text-primary" size={24} />
          AI Behavioral Analysis
          <BrainCircuit className="text-primary" size={24} />
        </h3>
        
        {generating && (
          <div className="p-10 rounded-[32px] glass border border-white/20 flex flex-col items-center justify-center gap-5 text-center shadow-2xl">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <div>
              <p className="text-lg font-black text-primary animate-pulse">Deep analysis in progress...</p>
              <p className="text-sm text-muted-foreground mt-1.5 font-medium">Synthesizing behavioral patterns and leadership traits.</p>
            </div>
          </div>
        )}

        {aiError && (
          <div className="p-5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center font-bold shadow-lg">
            {aiError}
            <button onClick={handleGenerateAnalysis} className="ml-4 px-4 py-2 bg-destructive/20 rounded-xl hover:bg-destructive/30 transition-all">Retry Analysis</button>
          </div>
        )}

        {aiAnalysis && (
          <div className="glass p-8 rounded-[32px] border border-white/20 shadow-2xl bg-white/40 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-50" />
            <div className="max-w-none leading-relaxed text-sm font-medium">
              {formatAnalysisText(aiAnalysis)}
            </div>
            <div className="mt-8 pt-6 border-t border-border/50 flex justify-between items-center">
              <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Generated by AI Psychologist</span>
              <button 
                onClick={() => setAiAnalysis('')}
                className="px-5 py-2 rounded-xl bg-secondary/50 text-xs font-black text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all uppercase tracking-widest border border-transparent hover:border-primary/20 flex items-center gap-2"
              >
                <RotateCcw size={14} />
                Reset & Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Generating analysis...</div>}>
      <ResultContent />
    </Suspense>
  );
}
