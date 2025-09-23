
import React, { useState } from 'react';
// YENİ: Servise eklediğimiz fonksiyonu import ediyoruz.
import { analyzeQuestion, generateSimilarQuiz } from '../services/geminiService';
import { useHistory } from '../context/HistoryContext';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
// YENİ: Quiz için soru tipini import ediyoruz.
import { AnalysisResult, ParsedQuestion } from '../types';
import AnalysisResultDisplay from '../components/AnalysisResultDisplay';
import { useChallenge } from '../context/ChallengeContext';

// --- YENİ: MiniQuiz Component'i ---
// Bu component, quiz'i göstermek ve yönetmek için kullanılır.
const MiniQuiz: React.FC<{ questions: ParsedQuestion[] }> = ({ questions }) => {
    const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
    const [showResults, setShowResults] = useState(false);

    const handleAnswerChange = (qIndex: number, answerKey: string) => {
        setUserAnswers(prev => ({ ...prev, [qIndex]: answerKey }));
    };

    const handleCheckAnswers = () => setShowResults(true);

    const score = Object.entries(userAnswers).reduce((acc, [qIndex, answer]) => {
        if (questions[Number(qIndex)].correctAnswer === answer) {
            return acc + 1;
        }
        return acc;
    }, 0);

    return (
        <div className="bg-bg-secondary p-6 rounded-lg shadow-lg mt-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-brand-primary mb-4">Mini Quiz</h3>
                {showResults && (
                    <div className="text-lg font-bold text-text-primary">
                        Sonuç: <span className="text-green-400">{score}</span> / {questions.length}
                    </div>
                )}
            </div>
            <div className="space-y-6">
                {questions.map((q, index) => (
                    <div key={index}>
                        <p className="font-semibold text-text-primary mb-3">
                            <span className="text-brand-primary">{index + 1}.</span> {q.questionText}
                        </p>
                        <div className="space-y-2">
                            {q.options.map(opt => {
                                const isSelected = userAnswers[index] === opt.key;
                                const isCorrect = opt.key === q.correctAnswer;
                                let stateClass = "border-transparent bg-gray-700 hover:bg-gray-600 cursor-pointer";
                                if (showResults) {
                                    stateClass = "border-transparent bg-gray-800 text-gray-400";
                                    if (isCorrect) stateClass = "border-green-500 bg-green-900/50 text-white";
                                    else if (isSelected && !isCorrect) stateClass = "border-red-500 bg-red-900/50 text-white";
                                }
                                return (
                                    <label key={opt.key} className={`flex items-center p-3 rounded-md transition-all duration-200 border-2 ${stateClass}`}>
                                        <input type="radio" name={`q-${index}`} value={opt.key} checked={isSelected} onChange={() => handleAnswerChange(index, opt.key)} disabled={showResults} className="hidden" />
                                        <span className={`font-bold mr-3 ${showResults && isCorrect ? 'text-green-400' : showResults && isSelected ? 'text-red-400' : 'text-brand-primary'}`}>{opt.key})</span>
                                        <span>{opt.value}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            {!showResults && (
                <button onClick={handleCheckAnswers} className="mt-6 w-full bg-brand-secondary hover:bg-brand-primary text-white font-bold py-3 px-4 rounded-md transition duration-300">
                    Cevapları Kontrol Et
                </button>
            )}
        </div>
    );
};

const QuestionAnalyzer: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const { addHistoryItem } = useHistory();
  const { trackAction } = useChallenge();

  // YENİ: Quiz için state'ler
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<ParsedQuestion[]>([]);

  const handleAnalyze = async () => {
    if (!question.trim()) {
      setError('Lütfen analiz edilecek bir soru girin.');
      return;
    }
    setIsLoading(true);
    setError('');
    setAnalysisResult(null);
    setQuizQuestions([]); // Analiz yaparken eski quizi temizle
    setQuizError('');     // Eski quiz hatasını temizle
    
    try {
      const resultText = await analyzeQuestion(question);
      const resultJson: AnalysisResult = JSON.parse(resultText);
      setAnalysisResult(resultJson);
      addHistoryItem(question, resultJson);
      trackAction('analyze', { questionType: resultJson.soruTipi });
    } catch (e: any) {
      setError(e.message || 'Analiz sırasında bir hata oluştu. Lütfen konsolu kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleGenerateQuiz = async () => {
    if (!analysisResult || !question) return;

    setIsQuizLoading(true);
    setQuizError('');
    try {
      const result = await generateSimilarQuiz(question, analysisResult);
      setQuizQuestions(result.questions || []);
      if (!result.questions || result.questions.length === 0) {
        setQuizError("Bu soruya benzer bir quiz oluşturulamadı. Lütfen farklı bir soru deneyin.");
      }
    } catch (e: any) {
      setQuizError(e.message || "Quiz oluşturulurken bir hata oluştu.");
    } finally {
      setIsQuizLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-text-primary">YDS Soru Analisti</h2>
        <p className="mb-4 text-text-secondary">YDS sorusunu aşağıya yapıştırın ve detaylı bir analiz alın.</p>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Analiz edilecek soruyu buraya yapıştırın..."
          className="w-full h-48 p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none text-text-primary resize-y"
          disabled={isLoading}
        />
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="mt-4 w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? 'Analiz Ediliyor...' : 'Soruyu Analiz Et'}
        </button>
      </div>

      {isLoading && <Loader />}
      <ErrorMessage message={error} />
      {analysisResult && <AnalysisResultDisplay result={analysisResult} />}
   {analysisResult && (
        <div className="mt-6 bg-bg-secondary p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-brand-primary">Pekiştirme Zamanı!</h3>
            <p className="text-text-secondary mt-2 mb-4">Bu sorunun konusunu ve gramer yapısını ne kadar anladığını test etmek için benzer sorulardan oluşan bir mini quiz çöz.</p>
            <button
                onClick={handleGenerateQuiz}
                disabled={isQuizLoading}
                className="w-full bg-brand-secondary hover:bg-brand-primary text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                {isQuizLoading ? 'Quiz Hazırlanıyor...' : '5 Soruluk Mini Quiz Hazırla'}
            </button>
        </div>
      )}

      {isQuizLoading && <Loader />}
      <ErrorMessage message={quizError} />
      {quizQuestions.length > 0 && <MiniQuiz questions={quizQuestions} />}
    </div>
  );
};

export default QuestionAnalyzer;
