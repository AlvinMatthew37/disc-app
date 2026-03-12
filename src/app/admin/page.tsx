'use client';

import { useState, useEffect } from 'react';
import { QuestionSet, Option, Trait } from '@/lib/disc-logic';
import { getQuestionSets, saveQuestionSet, deleteQuestionSet } from '@/lib/storage';
import { generateUUID } from '@/lib/utils';
import { Pencil, Plus, Trash2, FlaskConical, ListChecks, X } from 'lucide-react';

export default function AdminPage() {
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [options, setOptions] = useState<Record<Trait, string>>({
    D: '', I: '', S: '', C: ''
  });

  useEffect(() => {
    refreshSets();
  }, []);

  async function refreshSets() {
    setLoading(true);
    const data = await getQuestionSets();
    setSets(data);
    setLoading(false);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const setOptionsArr: Option[] = [
      { text: options.D, trait: 'D' },
      { text: options.I, trait: 'I' },
      { text: options.S, trait: 'S' },
      { text: options.C, trait: 'C' },
    ];

    const newSet: QuestionSet = {
      id: editingId || generateUUID(),
      options: setOptionsArr,
    };

    await saveQuestionSet(newSet);
    setOptions({ D: '', I: '', S: '', C: '' });
    setEditingId(null);
    refreshSets();
  };

  const handleEdit = (set: QuestionSet) => {
    const opts: Record<Trait, string> = { D: '', I: '', S: '', C: '' };
    set.options.forEach(o => {
      opts[o.trait] = o.text;
    });
    setOptions(opts);
    setEditingId(set.id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this question set?')) {
      await deleteQuestionSet(id);
      refreshSets();
    }
  };

  if (loading) return <div className="p-12 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <header className="mb-12 flex items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
          <FlaskConical size={32} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-4xl font-black text-primary italic uppercase tracking-tight">Question Lab</h1>
          <p className="text-muted-foreground text-lg">Define the behavioral sets used in the DISC assessment.</p>
        </div>
      </header>

      <div className="flex flex-col gap-12">
        {/* Form - Now at the Top */}
        <div className="w-full">
          <div className="glass p-8 rounded-3xl border border-white/20 shadow-2xl">
            <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-primary uppercase tracking-widest">
              <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                 {editingId ? <Pencil size={16} /> : <Plus size={18} />}
              </span>
              {editingId ? 'Edit Question Set' : 'New Question Set'}
            </h2>
            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(['D', 'I', 'S', 'C'] as Trait[]).map((trait) => (
                  <div key={trait}>
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 flex justify-between">
                      <span>Trait: {trait}</span>
                      <span className={`text-[10px] bg-disc-${trait.toLowerCase()}/10 text-disc-${trait.toLowerCase()} px-1.5 py-0.5 rounded font-bold`}>Required</span>
                    </label>
                    <textarea
                      value={options[trait]}
                      onChange={(e) => setOptions({ ...options, [trait]: e.target.value })}
                      className="w-full p-4 rounded-2xl bg-background border border-border focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all h-28 text-sm font-medium leading-relaxed"
                      placeholder={`Enter statement for ${trait}...`}
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-primary text-white font-black py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-sm tracking-widest uppercase">
                  {editingId ? 'UPDATE QUESTION SET' : 'ADD TO LIBRARY'}
                </button>
                {editingId && (
                  <button 
                    type="button" 
                    onClick={() => {
                        setEditingId(null);
                        setOptions({ D: '', I: '', S: '', C: '' });
                    }}
                    className="px-8 rounded-2xl bg-secondary font-bold text-sm tracking-widest uppercase hover:bg-secondary/80 transition-all border border-border"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List - Now below the form */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
            <h2 className="text-2xl font-black flex items-center gap-3">
               <span className="w-2 h-8 bg-primary rounded-full shadow-[0_0_10px_rgba(144,139,19,0.3)]" />
               Active Question Sets
            </h2>
            <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">{sets.length} SETS TOTAL</span>
          </div>
          
          <div className="flex flex-col gap-6">
            {sets.length === 0 ? (
                <div className="col-span-full">
                  <p className="text-muted-foreground glass p-12 rounded-[40px] text-center border-dashed border-2 border-border font-medium italic">Your question library is currently empty.</p>
                </div>
            ) : (
                sets.map((set, index) => (
                <div key={set.id} className="glass p-8 rounded-[36px] border border-white/20 shadow-sm relative group hover:shadow-xl transition-all duration-500 overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                    
                    <div className="flex justify-between items-start mb-6">
                        <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full tracking-[0.1em] uppercase">SET #{index + 1}</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEdit(set)} 
                            className="p-2.5 bg-secondary/50 rounded-xl hover:text-primary hover:bg-white transition-all shadow-sm flex items-center justify-center"
                            title="Edit"
                          >
                            <Pencil size={16} strokeWidth={2.5} />
                          </button>
                          <button 
                            onClick={() => handleDelete(set.id)} 
                            className="p-2.5 bg-secondary/50 rounded-xl hover:text-red-500 hover:bg-white transition-all shadow-sm flex items-center justify-center"
                            title="Delete"
                          >
                            <Trash2 size={16} strokeWidth={2.5} />
                          </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                    {set.options.map((opt) => (
                        <div key={opt.trait} className="flex gap-4 items-center bg-white/40 p-3 rounded-2xl border border-border/10 group-hover:bg-white/80 transition-colors">
                            <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 bg-disc-${opt.trait.toLowerCase()}/10 text-disc-${opt.trait.toLowerCase()} shadow-sm`}>{opt.trait}</span>
                            <p className="text-sm font-medium line-clamp-2 leading-relaxed">{opt.text}</p>
                        </div>
                    ))}
                    </div>
                </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
