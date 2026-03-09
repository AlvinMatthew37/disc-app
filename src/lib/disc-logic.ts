export type Trait = 'D' | 'I' | 'S' | 'C';

export interface Option {
  text: string;
  trait: Trait;
}

export interface QuestionSet {
  id: string;
  options: Option[]; // Traditionally 4 options (D, I, S, C) per set
}

export interface TestResult {
  id: string;
  date: string;
  userName: string;
  scores: Record<Trait, number>;
}

export interface Answer {
  questionSetId: string;
  most: Trait;
  least: Trait;
}

export const calculateScores = (answers: Answer[]): Record<Trait, number> => {
  const scores: Record<Trait, number> = { D: 0, I: 0, S: 0, C: 0 };
  
  answers.forEach((ans) => {
    if (ans.most) scores[ans.most]++;
    if (ans.least) scores[ans.least]--;
  });
  
  return scores;
};
