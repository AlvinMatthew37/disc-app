import { NextRequest } from 'next/server';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3:latest';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: true,
      }),
    });

    if (!response.ok) {
      return new Response(`Ollama error: ${response.statusText}`, { status: response.status });
    }

    // Pass through the stream from Ollama
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API AI Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
