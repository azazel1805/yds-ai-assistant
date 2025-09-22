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

// GÜNCELLENDİ: Bu fonksiyon artık kullanılmadığı için SİLİNDİ.
// const parseGeneratedQuestions = (text: string): ParsedQuiz => { ... };


// Cloze Test için parser kalıyor, çünkü o backend'den zaten her zaman belirli bir JSON yapısında geliyor.
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

  // GÜNCELLENDİ: Prompt'lar sadeleştirildi, formatlama talimatları kaldırıldı.
  const constructPrompt = (): string => {
    const basePrompts: { [key: string]: string } = {
        "Kelime Sorusu": `Generate EXACTLY ${questionCount} unique English Vocabulary Questions for the ${examType} exam in Turkey, at ${difficulty} difficulty level. Each question MUST be a distinct sentence with a blank for a word or phrasal verb. Provide 5 plausible multiple-choice options.`,
        "Dil Bilgisi Sorusu": `Generate ${questionCount} English Grammar Questions for the ${examType} exam in Turkey, at ${difficulty} difficulty level. Each question should be a sentence with 1 or 2 blanks related to tense, preposition, or conjunction. Provide 5 plausible multiple-choice options.`,
        "Cloze Test Sorusu": `Generate ${questionCount} unique English Cloze Test passage(s) for the ${examType} exam in Turkey, at a ${difficulty} difficulty level. Each passage must contain exactly 5 blanks, formatted as (1)___, (2)___, etc. The 5 blanks MUST test one of each of the following specific skills: Vocabulary, Phrasal Verb, Preposition, Tense, and Conjunction. For each blank, provide 5 plausible multiple-choice options, identify the correct one, and specify the questionType field accordingly. The topics should be diverse.`,
        "Cümle Tamamlama Sorusu": `Generate ${questionCount} English Sentence Completion Questions for the ${examType} exam in Turkey, at ${difficulty} difficulty level. Each question should be an incomplete sentence, and you should provide 5 plausible options to complete it logically and grammatically.`,
        "Çeviri Sorusu": `Generate ${questionCount} Translation Questions for the ${examType} exam in Turkey, at ${difficulty} difficulty level. Provide a sentence in ${translationDirection === 'tr_to_en' ? 'Turkish' : 'English'} and 5 options in ${translationDirection === 'tr_to_en' ? 'English' : 'Turkish'}, with one correct translation.`,
        "Paragraf Sorusu": `Generate EXACTLY ${questionCount} English Paragraph passage(s) for the ${examType} exam in Turkey, at ${difficulty} difficulty level. Each SINGLE passage MUST be followed by EXACTLY 3 OR 4 multiple-choice questions about it. Provide 5 answer choices for each question.`,
        "Diyalog Tamamlama Sorusu": `Generate EXACTLY ${questionCount} English Dialogue Completion Questions for the ${examType} exam in Turkey, at ${difficulty} difficulty level. Each dialogue must have a missing line. Provide 5 plausible options to fill the blank logically.`,
        "Restatement (Yeniden Yazma) Sorusu": `Generate ${questionCount} English Restatement Questions for the ${examType} exam in Turkey, at ${difficulty} difficulty level. Each question should present a sentence and 5 options that rephrase it, with only one being the correct restatement.`,
        "Paragraf Tamamlama Sorusu": `Generate ${questionCount} English Paragraph Completion Questions for the ${examType} exam in Turkey, at ${difficulty} difficulty level. Each question should be a paragraph with one sentence missing. Provide 5 plausible options to complete the paragraph coherently.`,
        "Akışı Bozan Cümle Sorusu": `Generate ${questionCount} English Irrelevant Sentence Questions for the ${examType} exam in Turkey, at ${difficulty} difficulty level. Each question should be a paragraph of five numbered sentences. One of these sentences should disrupt the logical flow of the paragraph. The options should be the sentences themselves.`,
    };
    return basePrompts[questionType as keyof typeof basePrompts] || basePrompts["Kelime Sorusu"];
  };

  // GÜNCELLENDİ: Artık metin ayrıştırma yerine doğrudan JSON işleniyor.
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
            const resultJson = JSON.parse(resultText); // Cloze test zaten JSON döner
            parsed = parseClozeTestJsonResponse(resultJson);
        } else {
            // Diğer tüm sorular için JSON modunu kullanıyoruz
            const resultText = await generateQuestions(prompt, true); // useJsonMode = true
            const parsedJson: ParsedQuiz = JSON.parse(resultText);
            
            // API'den gelen veriye ID ve analiz için tam metin ekleyelim
            const questionsWithIds = parsedJson.questions.map((q, index) => ({
                ...q,
                id: index,
                fullText: `${parsedJson.context ? parsedJson.context + '\n\n' : ''}${index + 1}. ${q.questionText}\n${q.options.map(o => `${o.key}) ${o.value}`).join('\n')}`
            }));

            parsed = { ...parsedJson, questions: questionsWithIds };
        }

        if (!parsed.questions || parsed.questions.length === 0) {
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
