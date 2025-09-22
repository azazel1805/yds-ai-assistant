
import React, { useState } from 'react';
import { analyzeQuestion } from '../services/geminiService';
import { useHistory } from '../context/HistoryContext';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { AnalysisResult } from '../types';
import AnalysisResultDisplay from '../components/AnalysisResultDisplay';
import { useChallenge } from '../context/ChallengeContext';

const QuestionAnalyzer: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const { addHistoryItem } = useHistory();
  const { trackAction } = useChallenge();


  const handleAnalyze = async () => {
    if (!question.trim()) {
      setError('Lütfen analiz edilecek bir soru girin.');
      return;
    }
    setIsLoading(true);
    setError('');
    setAnalysisResult(null);
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-text-primary">YDS Soru Analisti</h2>
        <p className="mb-4 text-text-secondary">YDS, YÖKDİL veya e-YDS sorusunu aşağıya yapıştırın ve detaylı bir analiz alın.</p>
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
    </div>
  );
};

export default QuestionAnalyzer;