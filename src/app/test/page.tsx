'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionSet, Trait, calculateScores, TestResult, Answer } from '@/lib/disc-logic';
import { getQuestionSets, saveResult } from '@/lib/storage';

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

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim() && rawSets.length > 0) {
      setIsStarted(true);
    }
  };

  const finishAssessment = async (finalAnswers: Answer[]) => {
    const scores = calculateScores(finalAnswers);
    const result: TestResult = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      userName,
      scores,
    };
    await saveResult(result);
    router.push(`/result?id=${result.id}`);
  };

  const handleNext = async () => {
    if (!currentMost || !currentLeast) {
      alert("Please select both 'Most' and 'Least' for this set.");
      return;
    }

    const currentSet = randomizedSets[currentIndex];
    const newAnswer: Answer = {
      questionSetId: currentSet.id,
      most: currentMost,
      least: currentLeast,
    };

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    if (currentIndex < randomizedSets.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentMost(null);
      setCurrentLeast(null);
    } else {
      await finishAssessment(newAnswers);
    }
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
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Time Remaining</span>
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
              <tr className="bg-primary/5 text-muted-foreground text-xs font-bold uppercase tracking-tighter">
                <th className="p-6 text-center w-24">S (Most)</th>
                <th className="p-6 text-center w-24">T (Least)</th>
                <th className="p-6 text-left">Pernyataan (Statement)</th>
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
                      className={`w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center font-bold text-xl ${
                        currentMost === opt.trait 
                        ? 'bg-yellow-400 border-yellow-500 text-black shadow-inner translate-y-1' 
                        : 'bg-background border-border hover:border-yellow-400 text-transparent'
                      }`}
                    >
                      ✓
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => {
                        setCurrentLeast(opt.trait);
                        if (currentMost === opt.trait) setCurrentMost(null);
                      }}
                      className={`w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center font-bold text-xl ${
                        currentLeast === opt.trait 
                        ? 'bg-green-500 border-green-600 text-white shadow-inner translate-y-1' 
                        : 'bg-background border-border hover:border-green-500 text-transparent'
                      }`}
                    >
                      ✓
                    </button>
                  </td>
                  <td className="p-6 text-lg font-medium">
                    {opt.text}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="p-8 bg-secondary/30 flex justify-between items-center">
             <p className="text-sm text-muted-foreground italic">
                  {currentMost && currentLeast 
                  ? "Selection complete! Click next." 
                  : "Please choose one statement you agree with MOST, and one you LEAST agree with."}
                </p>
             <button
               onClick={handleNext}
               disabled={!currentMost || !currentLeast}
               className="bg-primary px-12 py-4 rounded-xl text-white font-black shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
             >
               NEXT SET →
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
