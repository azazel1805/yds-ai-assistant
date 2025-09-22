import React, { useState, useEffect } from 'react';
import { generateQuestions, analyzeQuestion, generateClozeTest } from '../services/geminiService';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { EXAM_TYPES, DIFFICULTY_LEVELS, QUESTION_TYPES } from '../constants';
import { ParsedQuestion, AnalysisResult } from '../types';
import AnalysisResultDisplay from '../components/AnalysisResultDisplay';

export interface GeneratorConfig {
  questionType: string;
}

interface QuestionGeneratorProps {
  initialConfig: GeneratorConfig | null;
  onConfigUsed: () => void;
}

interface ParsedQuiz {
    context: string | null;
    questions: ParsedQuestion[];
}

const parseGeneratedQuestions = (text: string): ParsedQuiz => {
    const questions: ParsedQuestion[] = [];
    let context: string | null = null;
    
    const normalizedText = text.trim().replace(/\r\n/g, '\n');

    // Heuristic: The context is the text before the first numbered question that is followed by options.
    const firstQuestionRegex = /^\s*1\.(?!\d)[\s\S]*?\n\s*A\)/m;
    const firstQuestionMatch = normalizedText.match(firstQuestionRegex);
    let questionsText = normalizedText;

    if (firstQuestionMatch && firstQuestionMatch.index! > 0) {
        context = normalizedText.substring(0, firstQuestionMatch.index).trim();
        questionsText = normalizedText.substring(firstQuestionMatch.index);
    } else if (!/^\s*1\.(?!\d)/.test(normalizedText)) {
        // If the text doesn't start with a question number, it might all be context.
        const firstOptionMatch = normalizedText.match(/\n\s*1\./);
        if(firstOptionMatch && firstOptionMatch.index) {
            context = normalizedText.substring(0, firstOptionMatch.index).trim();
            questionsText = normalizedText.substring(firstOptionMatch.index).trim();
        }
    }
    
    // Split the text into individual question blocks. A question starts with "Number." at the beginning of a line.
    const questionBlocks = questionsText.split(/^\s*\d+\./m).filter(Boolean);

    // The first block might be part of the context if the text starts like "Passage... 1. Question..."
    if (!context && questionBlocks.length > 0 && !/[A-E]\)/.test(questionBlocks[0])) {
         context = (context ? context + '\n\n' : '') + questionBlocks.shift()!.trim();
    }

    for (const block of questionBlocks) {
        const cleanedBlock = block.trim();
        if (!cleanedBlock) continue;

        // More flexible regex for the answer key.
        const answerMatch = cleanedBlock.match(/(?:Correct answer|Answer is|Correct option|Doğru cevap)\s*:\s*([A-E])/i);
        const correctAnswer = answerMatch ? answerMatch[1].toUpperCase() : '';
        
        if (!correctAnswer) continue; // A question for a quiz needs a correct answer.

        // The question is everything before the first option marker (A), B), etc.)
        const optionsStartIndex = cleanedBlock.search(/\s*A\)/);
        if (optionsStartIndex === -1) continue;

        const questionText = cleanedBlock.substring(0, optionsStartIndex).trim();
        const optionsBlock = cleanedBlock.substring(optionsStartIndex);
        
        const optionRegex = /([A-E])\)(.*?)(?=\s*[A-E]\)|$)/gs;
        const options: { key: string; value: string }[] = [];
        let match;
        while ((match = optionRegex.exec(optionsBlock)) !== null) {
            const key = match[1].toUpperCase();
            // Clean up the value, remove the answer key part if it was captured
            const value = match[2].replace(/(?:Correct answer|Answer is|Correct option|Doğru cevap)\s*:\s*[A-E]/i, '').trim();
            if (value) {
                options.push({ key, value });
            }
        }

        if (options.length >= 2) { // A valid question should have at least 2 options
             const fullTextForAnalysis = `${context ? context + '\n\n' : ''}${questions.length + 1}. ${questionText}\n${options.map(o => `${o.key}) ${o.value}`).join('\n')}`;

            questions.push({
                id: questions.length,
                fullText: fullTextForAnalysis,
                questionText: questionText,
                options: options,
                correctAnswer: correctAnswer,
            });
        }
    }

    return { context, questions };
};

// --- New Types and Parser for Cloze Tests ---
interface ClozeTestResponse {
  clozeTests: {
    passage: string;
    questions: {
      blankNumber: number;
      questionType: string;
      options: string[];
      correctAnswer: string;
    }[];
  }[];
}

const parseClozeTestJsonResponse = (data: ClozeTestResponse): ParsedQuiz => {
    const allQuestions: ParsedQuestion[] = [];
    const allPassages: string[] = [];
    let questionIdCounter = 0;

    if (!data.clozeTests) {
        return { context: null, questions: [] };
    }

    data.clozeTests.forEach((test, passageIndex) => {
        const passageTitle = data.clozeTests.length > 1 ? `--- Passage ${passageIndex + 1} ---\n` : '';
        allPassages.push(`${passageTitle}${test.passage}`);

        test.questions.sort((a, b) => a.blankNumber - b.blankNumber).forEach((q) => {
            const optionLetters = ['A', 'B', 'C', 'D', 'E'];
            const correctIndex = q.options.findIndex(opt => opt.toLowerCase() === q.correctAnswer.toLowerCase());
            const correctAnswerLetter = correctIndex !== -1 ? optionLetters[correctIndex] : '';

            const question: ParsedQuestion = {
                id: questionIdCounter++,
                fullText: `${test.passage}\n\nQuestion for blank (${q.blankNumber}). Options:\n${q.options.map((o, i) => `${optionLetters[i]}) ${o}`).join('\n')}`,
                questionText: `Blank (${q.blankNumber}) - ${q.questionType}`,
                options: q.options.slice(0, 5).map((opt, i) => ({
                    key: optionLetters[i],
                    value: opt,
                })),
                correctAnswer: correctAnswerLetter,
            };
            allQuestions.push(question);
        });
    });
    
    return {
        context: allPassages.join('\n\n'),
        questions: allQuestions,
    };
}


const QuestionGenerator: React.FC<QuestionGeneratorProps> = ({ initialConfig, onConfigUsed }) => {
  const [questionType, setQuestionType] = useState(Object.keys(QUESTION_TYPES)[0]);
  const [examType, setExamType] = useState(EXAM_TYPES[0]);
  const [difficulty, setDifficulty] = useState(DIFFICULTY_LEVELS[1]);
  const [questionCount, setQuestionCount] = useState(1);
  const [translationDirection, setTranslationDirection] = useState('en_to_tr');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedQuiz, setGeneratedQuiz] = useState<ParsedQuiz>({ context: null, questions: [] });
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [analyses, setAnalyses] = useState<{ [key: number]: AnalysisResult | null }>({});
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);

  useEffect(() => {
    if (initialConfig) {
      if (Object.keys(QUESTION_TYPES).includes(initialConfig.questionType)) {
        setQuestionType(initialConfig.questionType);
      }
      onConfigUsed(); // Clear the config so it's a one-time setup
    }
  }, [initialConfig, onConfigUsed]);

  const constructPrompt = (): string => {
    const basePrompts: { [key: string]: string } = {
        "Kelime Sorusu": `IMPORTANT: Generate EXACTLY ${questionCount} completely new and unique English Vocabulary Questions for the ${examType} exam in Turkey, at ${difficulty} difficulty level. Each question MUST be a distinct sentence with a blank for a word or phrazal verb, covering diverse topics (e.g., daily life, nature, education, travel, emotions, technology) and using different sentence structures (e.g., questions, statements, negatives). STRICTLY AVOID repeating the same sentence, similar sentence patterns, or previously used topics across questions. The correct option must be chosen from the given choices, and options should be plausible but clearly distinguishable. Format: (Sentence with a ___ blank) A) Option 1 B) Option 2 C) Option 3 D) Option 4 E) Option 5 Correct answer: [letter] Number the questions (e.g., 1., 2., ...).`,
        "Dil Bilgisi Sorusu": `Generate ${questionCount} English Grammar Questions for the ${examType} exam in Turkey, at ${difficulty} difficulty level. Each question should be a sentence with 1 or 2 blanks related to tense, preposition, or conjunction, with the correct option chosen from the choices. Never repeat the same sentence. Format: (Sentence with ___ blank(s)) A) Option 1 B) Option 2 C) Option 3 D) Option 4 E) Option 5 Correct answer: [letter] Number the questions.`,
        "Cloze Test Sorusu": `Generate ${questionCount} unique English Cloze Test passage(s) for the ${examType} exam in Turkey, at a ${difficulty} difficulty level. Each passage must contain exactly 5 blanks, formatted as (1)___, (2)___, etc. The 5 blanks MUST test one of each of the following specific skills: Vocabulary, Phrasal Verb, Preposition, Tense, and Conjunction. The order of these question types within the passage can be mixed. For each blank, provide 5 plausible multiple-choice options, identify the correct one, and specify the questionType field accordingly. The topics should be diverse.`,
        "Cümle Tamamlama Sorusu": `Generate ${questionCount} English Sentence Completion Questions for the ${examType} exam in Turkey, at ${difficulty} difficulty level. Each question should be an incomplete sentence, give the main clause and ask for the sub clause or give the sub clause and ask for the main clause using an appropriate conjunction from the options. The blank can be in the middle or at the beginning but do not use any other completing if the blank is in the ending. Never repeat the same sentence. Format: (Incomplete sentence ___) A) Option 1 B) Option 2 C) Option 3 D) Option 4 E) Option 5 Correct answer: [letter] Number the questions.`,
        "Çeviri Sorusu": `Generate ${questionCount} Translation Questions for the ${examType} exam in Turkey, at ${difficulty} difficulty level. Each question should be a sentence translated from ${translationDirection === 'tr_to_en' ? 'Turkish to English' : 'English to Turkish'}. Provide a sentence in ${translationDirection === 'tr_to_en' ? 'Turkish' : 'English'} and 5 options in ${translationDirection === 'tr_to_en' ? 'English' : 'Turkish'}, with one correct translation. Ensure variety in sentence structures and topics. Format: (Sentence) A) Option 1 B) Option 2 C) Option 3 D) Option 4 E) Option 5 Correct answer: [letter] Number the questions.`,
        "Paragraf Sorusu": `Generate EXACTLY ${questionCount} English Paragraph passage(s) for the ${examType} exam in Turkey, at ${difficulty} difficulty level. Each SINGLE passage MUST be followed by EXACTLY 3 OR 4 multiple-choice questions about it. DO NOT generate more than 4 questions per passage. Each question must have 5 answer choices (A, B, C, D, E) and the correct answer explicitly stated. Format: (Paragraph text) 1. (Question) A) Option 1 B)... Correct answer: [Letter] 2. (Question) A) Option 1 B)... Correct answer: [Letter] 3. (Question) A) Option 1 B)... Correct answer: [Letter]. Ensure all questions have answers.`,
        "Diyalog Tamamlama Sorusu": `IMPORTANT: Generate EXACTLY ${questionCount} English Dialogue Completion Questions for the ${examType} exam in Turkey, at ${difficulty} difficulty level. Each dialogue must have exactly 5 sentences between two people with randomly chosen names (different names for each dialogue), following the order: Person1 → Person2 → Person1 → Person2 → Person1. One line must be completely missing and represented as '(Speaker: ___)' on its own line, where the missing line can randomly be the 1st, 2nd, 3rd, 4th, or 5th line. The speaker of the missing line must match its position (1st, 3rd, 5th is Person1; 2nd, 4th is Person2). The missing line must be a natural and logical part of the conversation. Format each dialogue followed by: A) Option 1 B) Option 2 C) Option 3 D) Option 4 E) Option 5 Correct answer: [letter] Number the questions.`,
        "Restatement (Yeniden Yazma) Sorusu": `Generate ${questionCount} English Restatement Questions for the ${examType} exam in Turkey, at ${difficulty} difficulty level. Each should be a sentence with 5 options rephrasing it, one correct. Format: (Sentence) A) Option 1 B) Option 2 C) Option 3 D) Option 4 E) Option 5 Correct answer: [letter] Number the questions.`,
        "Paragraf Tamamlama Sorusu": `Generate ${questionCount} English Paragraph Completion Questions for the ${examType} exam in Turkey, at ${difficulty} difficulty level. Each should be a paragraph with a 1-sentence blank. The blank can be any sentence in the paragraph and make it different for each question. Format: (Paragraph with a ___ blank) A) Option 1 B) Option 2 C) Option 3 D) Option 4 E) Option 5 Correct answer: [letter] Number the questions.`,
        "Akışı Bozan Cümle Sorusu": `Generate ${questionCount} English Irrelevant Sentence Questions for the ${examType} exam in Turkey, at ${difficulty} difficulty level. Each question should be a paragraph consisting of several sentences that follow a logical flow and coherence when read sequentially, but one sentence that is completely related to the topic but disrupts the logical flow or coherence. The task is to identify the sentence that breaks the flow. Format: (Paragraph text with numbered sentences, e.g., (1) Sentence 1. (2) Sentence 2. ...) A) Sentence 1 B) Sentence 2 C) Sentence 3 D) Sentence 4 E) Sentence 5 Correct answer: [letter] Number the questions.`,
    };
    return basePrompts[questionType as keyof typeof basePrompts] || basePrompts["Kelime Sorusu"];
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');
    setGeneratedQuiz({ context: null, questions: [] });
    setUserAnswers({});
    setShowResults(false);
    setAnalyses({});
    try {
        const prompt = constructPrompt();
        let parsed: ParsedQuiz;

        if (questionType === "Cloze Test Sorusu") {
            const resultText = await generateClozeTest(prompt);
            const resultJson = JSON.parse(resultText);
            parsed = parseClozeTestJsonResponse(resultJson);
        } else {
            const resultText = await generateQuestions(prompt);
            parsed = parseGeneratedQuestions(resultText);
        }

        if (parsed.questions.length === 0) {
            setError("Generated questions could not be parsed. The format might be unexpected. Please try again.");
        }
        setGeneratedQuiz(parsed);
    } catch (e: any) {
        setError(e.message || 'An error occurred while generating questions.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
  };
  
  const handleCheckAnswers = () => setShowResults(true);

  const handleShowAnalysis = async (questionId: number) => {
    if (analyses[questionId]) { // Toggle off if already visible
        setAnalyzingId(prev => prev === questionId ? null : questionId);
        return;
    }

    const question = generatedQuiz.questions.find(q => q.id === questionId);
    if (!question) return;

    setAnalyzingId(questionId);
    setError('');
    try {
        const resultText = await analyzeQuestion(question.fullText);
        const resultJson: AnalysisResult = JSON.parse(resultText);
        setAnalyses(prev => ({ ...prev, [questionId]: resultJson }));
    } catch (e: any)        {
        setError(`Failed to get analysis for question ${questionId + 1}: ${e.message}`);
        setAnalyzingId(null);
    }
  };

  const renderSelect = (label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: readonly string[]) => (
    <div className="flex-1 min-w-[150px]">
      <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
      <select value={value} onChange={onChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none text-text-primary">
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-text-primary">Soru Üretici</h2>
        <p className="mb-6 text-text-secondary">İstediğiniz kriterlere göre özgün sınav soruları oluşturun.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-text-secondary mb-1">Soru Tipi</label>
            <select value={questionType} onChange={(e) => setQuestionType(e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none text-text-primary">
              {Object.keys(QUESTION_TYPES).map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          {renderSelect("Sınav Tipi", examType, (e) => setExamType(e.target.value), EXAM_TYPES)}
          {renderSelect("Zorluk Seviyesi", difficulty, (e) => setDifficulty(e.target.value), DIFFICULTY_LEVELS)}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Soru Sayısı</label>
            <input type="number" min="1" max="10" value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value))} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none text-text-primary" />
          </div>
          {questionType === "Çeviri Sorusu" && (
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-text-secondary mb-1">Çeviri Yönü</label>
              <select value={translationDirection} onChange={(e) => setTranslationDirection(e.target.value)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none text-text-primary">
                <option value="en_to_tr">İngilizce'den Türkçe'ye</option>
                <option value="tr_to_en">Türkçe'den İngilizce'ye</option>
              </select>
            </div>
          )}
        </div>
        <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500 flex items-center justify-center">
          {isLoading ? 'Oluşturuluyor...' : 'Soruları Oluştur'}
        </button>
      </div>

      {isLoading && <Loader />}
      <ErrorMessage message={error} />
      
      {generatedQuiz.questions.length > 0 && (
        <div className="mt-6 space-y-6">
          {generatedQuiz.context && (
            <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                <h3 className="font-semibold text-brand-primary mb-4">Okuma Parçası / Metin</h3>
                <p className="text-text-secondary whitespace-pre-wrap">{generatedQuiz.context}</p>
            </div>
           )}
          {generatedQuiz.questions.map((q, index) => {
            const isCorrectlyAnswered = userAnswers[q.id] === q.correctAnswer;
            return (
              <div key={q.id} className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                <p className="font-semibold text-text-primary mb-4 whitespace-pre-wrap"><span className="text-brand-primary">{index + 1}.</span> {q.questionText}</p>
                <div className="space-y-3">
                  {q.options.map(opt => {
                    const isSelected = userAnswers[q.id] === opt.key;
                    const isCorrect = opt.key === q.correctAnswer;
                    let baseClass = "flex items-center p-3 rounded-md transition-all duration-200 border-2";
                    let stateClass = "border-transparent bg-gray-700 hover:bg-gray-600 cursor-pointer";

                    if (showResults) {
                      stateClass = "border-transparent bg-gray-800 text-gray-400"; // Default for unchecked
                      if (isCorrect) stateClass = "border-green-500 bg-green-900/50 text-white";
                      else if (isSelected && !isCorrect) stateClass = "border-red-500 bg-red-900/50 text-white";
                    }

                    return (
                      <label key={opt.key} className={`${baseClass} ${stateClass}`}>
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          value={opt.key}
                          checked={isSelected}
                          onChange={() => handleAnswerChange(q.id, opt.key)}
                          disabled={showResults}
                          className="w-4 h-4 text-brand-primary bg-gray-600 border-gray-500 focus:ring-brand-primary ring-offset-bg-secondary hidden"
                        />
                        <span className={`font-bold mr-3 ${showResults && isCorrect ? 'text-green-400' : showResults && isSelected ? 'text-red-400' : 'text-brand-primary'}`}>{opt.key})</span>
                        <span>{opt.value}</span>
                      </label>
                    );
                  })}
                </div>
                {showResults && (
                    <div className='mt-4'>
                        <button onClick={() => handleShowAnalysis(q.id)} className="text-sm text-brand-primary hover:underline">
                           {analyzingId === q.id && analyses[q.id] ? 'Analizi Gizle' : 'Analizi Göster'}
                        </button>
                        {analyzingId === q.id && !analyses[q.id] && <div className="text-sm text-text-secondary">Analiz ediliyor...</div>}
                        {analyzingId === q.id && analyses[q.id] && <AnalysisResultDisplay result={analyses[q.id]!} />}
                    </div>
                )}
              </div>
            );
          })}
          {!showResults && (
            <button onClick={handleCheckAnswers} className="w-full bg-brand-secondary hover:bg-brand-primary text-white font-bold py-3 px-4 rounded-md transition duration-300">
              Cevapları Kontrol Et
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionGenerator;