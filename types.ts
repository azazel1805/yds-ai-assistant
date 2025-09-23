
export interface AnalysisResult {
  soruTipi?: string;
  analiz?: {
    adim_1_ana_tema?: string;
    adim_2_cumle_1_iliskisi?: string;
    adim_3_cumle_2_iliskisi?: string;
    adim_4_cumle_3_iliskisi?: string;
    adim_5_cumle_4_iliskisi?: string;
    adim_6_cumle_5_iliskisi?: string;
    adim_7_sonuc?: string;
    [key: string]: any; 
  };
  konu?: string;
  zorlukSeviyesi?: string;
  dogruCevap?: string;
  detayliAciklama?: string;
  digerSecenekler?: {
    secenek: string;
    aciklama: string;
  }[];
}

export interface HistoryItem {
  id: string;
  question: string;
  analysis: AnalysisResult;
  timestamp: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ReadingQuestion {
  question: string;
  options: {
    key: string;
    value: string;
  }[];
  correctAnswer: string;
}

export interface KeyVocabulary {
  word: string;
  meaning: string;
}

export interface ReadingAnalysisResult {
  summary: string;
  vocabulary: KeyVocabulary[];
  questions: ReadingQuestion[];
}

// Fix: Add ParsedQuestion interface for QuestionGenerator
export interface ParsedQuestion {
  id: number;
  fullText: string;
  questionText: string;
  options: {
    key: string;
    value: string;
  }[];
  correctAnswer: string;
}

// Fix: Add ListeningTask interface for ListeningPractice
export interface ListeningTask {
  script: string;
  questions: ReadingQuestion[];
}

export interface PersonalizedFeedback {
  recommendation: string;
  weakTopics: {
    topic: string;
    questionType: string; // The exact key from QUESTION_TYPES
  }[];
}

export interface GrammarFeedback {
  error: string;
  correction: string;
  explanation: string;
}

export interface VocabularySuggestion {
  original: string;
  suggestion: string;
  reason: string;
}

export interface WritingAnalysis {
  overallFeedback: string;
  grammar: GrammarFeedback[];
  vocabulary: VocabularySuggestion[];
  structureAndCohesion: string;
}

// Types for Passage Deconstruction
export interface DeconstructedSentence {
  originalSentence: string;
  simplifiedSentence: string;
  grammarExplanation: string;
  vocabulary: KeyVocabulary[];
}
export interface PassageDeconstructionResult {
  mainIdea: string;
  authorTone: string;
  deconstructedSentences: DeconstructedSentence[];
}

// Types for Daily Challenge
// Removed 'listening' from ChallengeType as the feature is deleted.
export type ChallengeType = 'analyze' | 'dictionary' | 'tutor' | 'reading' | 'writing';

export interface DailyChallenge {
  id: string;
  description: string;
  type: ChallengeType;
  target: number;
  progress: number;
  completed: boolean;
  meta?: { // For specific challenges like analyzing a certain type
    questionType?: string;
  };
}

export interface ChallengeState {
  currentChallenge: DailyChallenge | null;
  lastCompletedDate: string | null;
  streak: number;
}

// Type for Vocabulary Trainer
export interface VocabularyItem {
  id: string;
  word: string;
  meaning: string;
}
