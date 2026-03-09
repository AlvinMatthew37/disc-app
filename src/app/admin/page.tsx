'use client';

import { useState, useEffect } from 'react';
import { QuestionSet, Option, Trait } from '@/lib/disc-logic';
import { getQuestionSets, saveQuestionSet, deleteQuestionSet } from '@/lib/storage';

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
      id: editingId || crypto.randomUUID(),
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

  if (loading) return <div className="p-12 text-center text-muted-foreground">Syncing with Supabase...</div>;

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-gradient italic">Question Lab</h1>
        <p className="text-muted-foreground text-lg">Define the behavioral sets used in the DISC assessment.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="glass p-8 rounded-3xl border border-white/20 shadow-2xl sticky top-24">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              {editingId ? 'Edit Question Set' : 'New Question Set'}
            </h2>
            <form onSubmit={handleSave} className="space-y-6">
              {(['D', 'I', 'S', 'C'] as Trait[]).map((trait) => (
                <div key={trait}>
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2 flex justify-between">
                    <span>Trait: {trait}</span>
                    <span className={`text-[10px] bg-disc-${trait.toLowerCase()}/10 text-disc-${trait.toLowerCase()} px-1 rounded`}>Required</span>
                  </label>
                  <textarea
                    value={options[trait]}
                    onChange={(e) => setOptions({ ...options, [trait]: e.target.value })}
                    className="w-full p-4 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none transition-all h-24 text-sm"
                    placeholder={`Enter statement for ${trait}...`}
                    required
                  />
                </div>
              ))}
              <div className="flex gap-3">
                <button type="submit" className="flex-1 grad-primary text-white font-black py-4 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all">
                  {editingId ? 'UPDATE SET' : 'ADD TO LIBRARY'}
                </button>
                {editingId && (
                  <button 
                    type="button" 
                    onClick={() => {
                        setEditingId(null);
                        setOptions({ D: '', I: '', S: '', C: '' });
                    }}
                    className="px-6 rounded-2xl bg-secondary font-bold"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
             <span className="w-2 h-8 grad-primary rounded-full" />
             Active Question Sets
          </h2>
          <div className="space-y-4">
            {sets.length === 0 ? (
                <p className="text-muted-foreground glass p-8 rounded-3xl text-center border-dashed border-2 border-border">Your question library is empty.</p>
            ) : (
                sets.map((set, index) => (
                <div key={set.id} className="glass p-6 rounded-3xl border border-white/20 shadow-sm relative group">
                    <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(set)} className="p-2 bg-secondary rounded-lg hover:text-primary transition-colors">Edit</button>
                    <button onClick={() => handleDelete(set.id)} className="p-2 bg-secondary rounded-lg hover:text-red-500 transition-colors">Delete</button>
                    </div>
                    <div className="mb-4">
                        <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded">SET #{index + 1}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                    {set.options.map((opt) => (
                        <div key={opt.trait} className="flex gap-3 items-start">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 bg-disc-${opt.trait.toLowerCase()}/10 text-disc-${opt.trait.toLowerCase()}`}>{opt.trait}</span>
                            <p className="text-sm line-clamp-2">{opt.text}</p>
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
