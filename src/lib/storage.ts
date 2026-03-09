import { supabase } from './supabase';
import { QuestionSet, TestResult } from './disc-logic';

// --- Question Sets ---

export async function getQuestionSets(): Promise<QuestionSet[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('question_sets')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching question sets:', error);
    return [];
  }
  return data as QuestionSet[];
}

export async function saveQuestionSet(set: QuestionSet): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('question_sets')
    .upsert({ 
      id: set.id,
      options: set.options 
    });

  if (error) console.error('Error saving question set:', error);
}

export async function deleteQuestionSet(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('question_sets')
    .delete()
    .eq('id', id);

  if (error) console.error('Error deleting question set:', error);
}

// --- Test Results ---

export async function getHistory(): Promise<TestResult[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }
  return data.map((item: any) => ({
    id: item.id,
    date: item.created_at,
    userName: item.user_name,
    scores: item.scores
  })) as TestResult[];
}

export async function getResultById(id: string): Promise<TestResult | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching result by id:', error);
    return null;
  }
  
  return {
    id: data.id,
    date: data.created_at,
    userName: data.user_name,
    scores: data.scores
  } as TestResult;
}

export async function saveResult(result: TestResult): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('test_results')
    .insert({
      id: result.id,
      user_name: result.userName,
      scores: result.scores
    });

  if (error) console.error('Error saving result:', error);
}
