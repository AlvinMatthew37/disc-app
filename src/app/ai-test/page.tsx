'use client';

import { useState } from 'react';
import { askAI } from '@/lib/ai-service';

export default function AITestPage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleTest() {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        
        // Ollama sends JSON objects in chunks when streaming
        try {
          const lines = chunkValue.split('\n').filter(l => l.trim());
          for (const line of lines) {
            const data = JSON.parse(line);
            if (data.response) {
              setResponse(prev => prev + data.response);
            }
          }
        } catch (e) {
          console.warn('Error parsing stream chunk:', e);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-primary">AI Model Test</h1>
        <p className="text-muted-foreground">Verify connection to Ollama ({process.env.NEXT_PUBLIC_OLLAMA_MODEL || 'gemma3:12b'})</p>
      </header>

      <div className="glass p-8 rounded-3xl border border-white/20 shadow-xl flex flex-col gap-6">
        <div>
          <label className="block text-sm font-black text-muted-foreground uppercase tracking-widest mb-2">Test Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask anything to the AI..."
            className="w-full h-32 p-4 rounded-2xl bg-secondary/30 border border-border focus:outline-none focus:border-primary/50 transition-all resize-none"
          />
        </div>

        <button
          onClick={handleTest}
          disabled={loading || !prompt.trim()}
          className="px-8 py-4 rounded-2xl bg-primary text-white font-black hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:scale-100"
        >
          {loading ? 'Thinking...' : 'Run Test'}
        </button>

        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold">
            {error}
          </div>
        )}

        {response && (
          <div className="mt-4">
            <label className="block text-sm font-black text-muted-foreground uppercase tracking-widest mb-2">AI Response</label>
            <div className="p-6 rounded-2xl bg-secondary/50 border border-border whitespace-pre-wrap leading-relaxed">
              {response}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
