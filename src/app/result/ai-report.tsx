import { TestResult, Trait } from '@/lib/disc-logic';
import { updateResultReport } from '@/lib/storage';
import { askAI } from '@/lib/ai-service';

export function formatAnalysisText(text: string) {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim();
    
    // Check for header (entire line is bold)
    if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.indexOf('**', 2) === trimmed.length - 2) {
      return <h4 key={i} className="text-xl font-black text-[#1a2d4d] mt-8 mb-4 border-b border-border/50 pb-2">{trimmed.slice(2, -2)}</h4>;
    }

    // Check for bullet points
    const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ');
    let content = trimmed;
    if (isBullet) {
      content = content.substring(2);
    }

    // Parse bold text inline
    const parts = content.split(/(\*\*.*?\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="font-extrabold text-[#1a2d4d]">{part.substring(2, part.length - 2)}</strong>;
      }
      return part;
    });

    if (isBullet) {
      return (
        <div key={i} className="flex items-start gap-3 mb-3 ml-4">
          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
          <div className="flex-1">{parts}</div>
        </div>
      );
    }

    if (!trimmed) {
      return null;
    }

    return <p key={i} className="mb-4 text-[#2d3748]">{parts}</p>;
  });
}

export async function generateAnalysis(
  result: TestResult,
  rawScores: Record<Trait, number>,
  setGenerating: (val: boolean) => void,
  setAiError: (val: string) => void,
  setAiAnalysis: (val: string) => void
) {
  setGenerating(true);
  setAiError('');
  
  const prompt = `Acting as a Senior Psychologist, provide a professional behavioral analysis for ${result.userName} based on their DISC scores: 
D: ${rawScores.D}, I: ${rawScores.I}, S: ${rawScores.S}, C: ${rawScores.C}. 

Focus on their communication style, work environment preferences, and potential strengths/blind spots. 
Keep the tone professional, insightful, and constructive. Return the response in a well-structured format.`;

  const response = await askAI(prompt);
  
  if (response.success && response.text) {
    setAiAnalysis(response.text);
    // Save it to database
    await updateResultReport(result.id, response.text);
  } else {
    setAiError(response.error || 'Failed to generate analysis');
  }
  setGenerating(false);
}
