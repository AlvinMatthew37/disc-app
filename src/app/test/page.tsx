'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionSet, Trait, calculateScores, TestResult, Answer } from '@/lib/disc-logic';
import { getQuestionSets, saveResult } from '@/lib/storage';
import { generateUUID } from '@/lib/utils';
import { Check, ArrowRight, Timer, ClipboardList, ChevronLeft } from 'lucide-react';

// Fisher-Yates Shuffle
function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default function TestPage() {
  const router = useRouter();
  const [rawSets, setRawSets] = useState<QuestionSet[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [userName, setUserName] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 10 seconds for testing
  
  const [loading, setLoading] = useState(true);
  
  const [currentMost, setCurrentMost] = useState<Trait | null>(null);
  const [currentLeast, setCurrentLeast] = useState<Trait | null>(null);
  const [maxReachedIndex, setMaxReachedIndex] = useState(0);

  // Timer logic
  useEffect(() => {
    if (!isStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishAssessment(answers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, timeLeft, answers]);

  // Randomize sets and options once when starting
  const randomizedSets = useMemo(() => {
    if (!isStarted) return [];
    return shuffle(rawSets).map(set => ({
      ...set,
      options: shuffle(set.options)
    }));
  }, [isStarted, rawSets]);

  useEffect(() => {
    async function loadSets() {
      const data = await getQuestionSets();
      setRawSets(data);
      setLoading(false);
    }
    loadSets();
  }, []);

  const loadSelectionForIndex = (index: number, currentAnswers: Answer[]) => {
    const nextSet = randomizedSets[index];
    const existingAnswer = currentAnswers.find(a => a.questionSetId === nextSet.id);
    if (existingAnswer) {
      setCurrentMost(existingAnswer.most);
      setCurrentLeast(existingAnswer.least);
    } else {
      setCurrentMost(null);
      setCurrentLeast(null);
    }
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim() && rawSets.length > 0) {
      setIsStarted(true);
    }
  };

  const finishAssessment = async (finalAnswers: Answer[]) => {
    setLoading(true);
    const scores = calculateScores(finalAnswers);
    const result: TestResult = {
      id: generateUUID(),
      date: new Date().toISOString(),
      userName,
      scores,
    };
    await saveResult(result);
    router.push(`/result?id=${result.id}`);
  };

  const saveCurrentSelection = () => {
    if (!currentMost || !currentLeast) return answers;

    const currentSet = randomizedSets[currentIndex];
    const newAnswer: Answer = {
      questionSetId: currentSet.id,
      most: currentMost,
      least: currentLeast,
    };

    const existingIndex = answers.findIndex(a => a.questionSetId === currentSet.id);
    let updated;
    if (existingIndex > -1) {
      updated = [...answers];
      updated[existingIndex] = newAnswer;
    } else {
      updated = [...answers, newAnswer];
    }
    setAnswers(updated);
    return updated;
  };

  const handleNext = async () => {
    const updatedAnswers = saveCurrentSelection();
    
    const nextIndex = currentIndex + 1;
    if (nextIndex > maxReachedIndex) {
      setMaxReachedIndex(nextIndex);
    }

    if (currentIndex < randomizedSets.length - 1) {
      loadSelectionForIndex(nextIndex, updatedAnswers);
      setCurrentIndex(nextIndex);
    } else {
      await finishAssessment(updatedAnswers);
    }
  };

  const handleBack = () => {
    const updatedAnswers = saveCurrentSelection();
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      loadSelectionForIndex(prevIndex, updatedAnswers);
      setCurrentIndex(prevIndex);
    }
  };

  const goToQuestion = (index: number) => {
    const updatedAnswers = saveCurrentSelection();
    loadSelectionForIndex(index, updatedAnswers);
    setCurrentIndex(index);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading assessment...</div>;
  }

  if (rawSets.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">No Question Sets</h2>
        <p className="text-muted-foreground mb-8">Please add sets of 4 statements in the Admin panel.</p>
        <button onClick={() => router.push('/admin')} className="bg-primary px-8 py-3 rounded-xl text-white font-bold">Admin Panel</button>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="glass p-12 rounded-3xl max-w-md w-full text-center">
          <h1 className="text-3xl font-bold mb-4">DISC Assessment</h1>
          <p className="text-muted-foreground mb-8">For each set, select the phrase that describes you **Most** and the one that describes you **Least**.</p>
          <form onSubmit={handleStart} className="space-y-6">
            <div className="text-left">
              <label className="block text-sm font-medium mb-2">Participant Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Name"
                className="w-full p-4 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
                required
              />
            </div>
            <button type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-xl">Start Test</button>
          </form>
        </div>
      </div>
    );
  }

  const currentSet = randomizedSets[currentIndex];
  const progress = ((currentIndex + 1) / randomizedSets.length) * 100;

  // Format time (MM:SS)
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="min-h-screen p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <div className="mb-12">
          <div className="flex justify-between items-end mb-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Progress</span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-foreground">Set {currentIndex + 1}</span>
                <span className="text-sm font-bold text-muted-foreground">of {randomizedSets.length}</span>
              </div>
            </div>

            <div className={`flex flex-col items-end gap-1 ${timeLeft <= 5 ? 'animate-pulse' : ''}`}>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Timer size={14} className={timeLeft <= 5 ? 'text-destructive' : ''} />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Time Remaining</span>
              </div>
              <span className={`text-3xl font-black tabular-nums ${timeLeft <= 5 ? 'text-destructive' : 'text-primary'}`}>
                {timeString}
              </span>
            </div>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="glass rounded-3xl overflow-hidden shadow-2xl border-white/20">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-primary/5 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="p-6 text-center w-28 italic">Most (M)</th>
                <th className="p-6 text-center w-28 italic">Least (L)</th>
                <th className="p-6 text-center">Pernyataan (Statement)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {currentSet.options.map((opt, idx) => (
                <tr key={`${currentSet.id}-${idx}`} className="hover:bg-primary/5 transition-colors group">
                  <td className="p-4 text-center">
                    <button
                      onClick={() => {
                        setCurrentMost(opt.trait);
                        if (currentLeast === opt.trait) setCurrentLeast(null);
                      }}
                      className={`w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center mx-auto ${
                        currentMost === opt.trait 
                        ? 'bg-yellow-400 border-yellow-500 text-black shadow-inner translate-y-0.5' 
                        : 'bg-background border-border hover:border-yellow-400 text-transparent'
                      }`}
                    >
                      <Check size={24} strokeWidth={3} className={currentMost === opt.trait ? 'opacity-100' : 'opacity-0'} />
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => {
                        setCurrentLeast(opt.trait);
                        if (currentMost === opt.trait) setCurrentMost(null);
                      }}
                      className={`w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center mx-auto ${
                        currentLeast === opt.trait 
                        ? 'bg-green-500 border-green-600 text-white shadow-inner translate-y-0.5' 
                        : 'bg-background border-border hover:border-green-500 text-transparent'
                      }`}
                    >
                      <Check size={24} strokeWidth={3} className={currentLeast === opt.trait ? 'opacity-100' : 'opacity-0'} />
                    </button>
                  </td>
                  <td className="p-6 text-lg font-medium text-center">
                    {opt.text}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="p-8 bg-secondary/30 flex justify-between items-center">
             <div className="flex gap-4">
              <button
                onClick={handleBack}
                disabled={currentIndex === 0}
                className="px-6 py-4 rounded-xl bg-background border border-border text-muted-foreground font-bold hover:bg-secondary transition-all disabled:opacity-30 disabled:hover:bg-background flex items-center gap-2"
              >
                <ChevronLeft size={20} /> PREVIOUS
              </button>
             </div>

             <div className="flex items-center gap-6">
               <p className={`text-xs font-bold uppercase tracking-wider transition-all ${
                    currentMost && currentLeast ? 'text-success' : 'text-muted-foreground'
               }`}>
                    {currentMost && currentLeast 
                    ? "Selection complete ✓" 
                    : "Selection required to proceed"}
               </p>
               <button
                 onClick={handleNext}
                 disabled={!currentMost || !currentLeast}
                 className={`px-12 py-4 rounded-xl text-white font-black shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-20 disabled:hover:scale-100 ${
                   !currentMost || !currentLeast ? 'bg-muted-foreground' : 'bg-primary'
                 }`}
               >
                 {currentIndex === randomizedSets.length - 1 ? 'FINISH TEST' : 'NEXT SET'} 
                 <ArrowRight size={20} />
               </button>
             </div>
          </div>
        </div>

        {/* Question Jumper */}
        <div className="mt-8 w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <ClipboardList size={16} /> Question Navigator
            </h3>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">
              {answers.length} of {randomizedSets.length} Answered
            </span>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {randomizedSets.map((set, idx) => {
              const isAnswered = answers.some(a => a.questionSetId === set.id);
              const isCurrent = idx === currentIndex;
              const isLocked = idx > maxReachedIndex;
              
              return (
                <button
                  key={set.id}
                  onClick={() => !isLocked && goToQuestion(idx)}
                  disabled={isLocked}
                  className={`w-12 h-12 rounded-xl font-black text-xs transition-all flex items-center justify-center border-2 ${
                    isCurrent 
                      ? 'bg-primary border-primary text-white shadow-lg scale-110 z-10' 
                      : isLocked
                        ? 'bg-secondary/20 border-secondary/10 text-muted-foreground/20 cursor-not-allowed'
                        : isAnswered 
                          ? 'bg-success/10 border-success/30 text-success hover:bg-success/20' 
                          : 'bg-background border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
