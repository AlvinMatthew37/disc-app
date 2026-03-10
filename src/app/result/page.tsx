'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { TestResult, Trait } from '@/lib/disc-logic';
import { getHistory, getResultById, updateResultReport } from '@/lib/storage';
import { askAI } from '@/lib/ai-service';

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<TestResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    async function loadResult() {
      const id = searchParams.get('id');
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
      generateAnalysis();
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

  async function generateAnalysis() {
    if (!result) return;
    setGenerating(true);
    setAiError('');
    
    const prompt = `Acting as a Senior Psychologist, provide a professional behavioral analysis for ${result.userName} based on their DISC scores: 
D: ${rawScores.D}, I: ${rawScores.I}, S: ${rawScores.S}, C: ${rawScores.C}. 

Focus on their communication style, work environment preferences, and potential strengths/blind spots. 
Keep the tone professional, insightful, and constructive. Return the response in a well-structured format.`;

    const response = await askAI(prompt);
    
    if (response.success) {
      setAiAnalysis(response.text);
      // Save it to database
      await updateResultReport(result.id, response.text);
    } else {
      setAiError(response.error || 'Failed to generate analysis');
    }
    setGenerating(false);
  }

  return (
    <div className="min-h-screen px-32 py-8 mx-auto">
      <div className="flex justify-between items-center mb-12">
        <button 
          onClick={() => router.push('/')}
          className="px-6 py-3 rounded-xl bg-secondary font-bold hover:bg-secondary/80 transition-all border border-border flex items-center gap-2 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
          DASHBOARD
        </button>
        <div className="text-right">
          <h1 className="text-3xl font-black text-gradient italic">Assessment Result</h1>
          <p className="text-sm text-muted-foreground">Position Analysis for <span className="text-foreground font-semibold underline decoration-primary decoration-2">{result.userName}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visualization (Takes 7/12) */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          <div className="relative w-full bg-white p-8 rounded-3xl shadow-xl border border-border">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-[#1a2d4d]">Assessment Profile</h3>
            </div>
            
            <div className="relative h-[450px] w-full bg-white">
              {/* SVG for Grid, Labels, and Data */}
              <svg viewBox="-60 0 860 400" className="absolute inset-0 w-full h-full overflow-visible">
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
                      <path d={d} fill="none" stroke="#0070c0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                      {points.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="8" fill="#0070c0" />
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Bottom Labels (D I S C) */}
            <div className="flex justify-around ml-[6.5%] mt-4">
              {traits.map(t => (
                <div key={t.key} className="text-center w-0 flex-1">
                  <div className="text-lg font-black text-[#1a2d4d]">{t.key}</div>
                  <div className="text-sm font-bold text-muted-foreground">({rawScores[t.key]})</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Breakdown & Detail (Takes 5/12) */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div className="glass p-8 rounded-[32px] border-l-12 border-l-primary shadow-xl">
            <h2 className="text-2xl font-black mb-3 text-[#1a2d4d]">Primary Style: {maxTrait.label}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed italic">{maxTrait.desc}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {traits.map((t) => (
              <div key={t.key} className="p-6 rounded-3xl bg-[#f2f4f7] border border-border shadow-inner flex flex-col items-center group hover:bg-white transition-colors">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl bg-white text-[#1a2d4d] shadow-sm mb-3 group-hover:scale-110 transition-transform`}>
                  {t.key}
                </span>
                <span className="text-xs font-bold text-muted-foreground uppercase mb-1 tracking-widest">{t.label}</span>
                <span className="text-2xl font-black text-[#1a2d4d]">
                  {rawScores[t.key] > 0 ? `+${rawScores[t.key]}` : rawScores[t.key]}
                </span>
              </div>
            ))}
          </div>

          <div className="glass p-8 rounded-3xl border border-white/20 shadow-lg text-sm text-muted-foreground leading-relaxed">
            <h4 className="font-bold text-foreground mb-2 uppercase tracking-tight text-xs">Interpretation Note</h4>
            This profile represents your behavior adjusted to your current position. Higher scores indicate a natural preference for those specific environments and communication styles.
          </div>
        </div>
      </div>

      {/* AI Behavioral Analysis - Full Width Center */}
      <div className="mt-12 max-w-5xl mx-auto flex flex-col gap-6">
        <h3 className="text-2xl font-black text-[#1a2d4d] flex items-center gap-3 justify-center">
          <span className="w-8 h-1.5 grad-primary rounded-full" />
          AI Behavioral Analysis
          <span className="w-8 h-1.5 grad-primary rounded-full" />
        </h3>
        
        {generating && (
          <div className="p-12 rounded-[40px] glass border border-white/20 flex flex-col items-center justify-center gap-6 text-center shadow-2xl">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <div>
              <p className="text-xl font-black text-primary animate-pulse">Deep analysis in progress...</p>
              <p className="text-muted-foreground mt-2 font-medium">Synthesizing behavioral patterns and leadership traits.</p>
            </div>
          </div>
        )}

        {aiError && (
          <div className="p-6 rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive text-center font-bold shadow-lg">
            {aiError}
            <button onClick={generateAnalysis} className="ml-4 px-4 py-2 bg-destructive/20 rounded-xl hover:bg-destructive/30 transition-all">Retry Analysis</button>
          </div>
        )}

        {aiAnalysis && (
          <div className="glass p-10 rounded-[40px] border border-white/20 shadow-2xl bg-white/40 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 grad-primary opacity-50" />
            <div className="prose prose-lg prose-slate max-w-none whitespace-pre-wrap leading-relaxed font-medium text-[#2d3748]">
              {aiAnalysis}
            </div>
            <div className="mt-10 pt-8 border-t border-border/50 flex justify-between items-center">
              <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Generated by AI Psychologist</span>
              <button 
                onClick={() => setAiAnalysis('')}
                className="px-5 py-2 rounded-xl bg-secondary/50 text-xs font-black text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all uppercase tracking-widest border border-transparent hover:border-primary/20"
              >
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
