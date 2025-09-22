import React, { useState } from 'react';
// Yeni servis fonksiyonlarını import ediyoruz
import { getReadingSummaryAndVocab, getReadingQuestions } from '../services/geminiService';
import { ReadingAnalysisResult } from '../types';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { useChallenge } from '../context/ChallengeContext';
import { useVocabulary } from '../context/VocabularyContext';

const ReadingPractice: React.FC = () => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Soruların yüklenmesi için ayrı bir state
  const [areQuestionsLoading, setAreQuestionsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ReadingAnalysisResult | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const { trackAction } = useChallenge();
  const { addWord, removeWord, isWordSaved } = useVocabulary();

  const handleToggleSaveWord = (word: string, meaning: string) => {
    if (isWordSaved(word)) {
      removeWord(word);
    } else {
      addWord(word, meaning);
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Lütfen analiz edilecek bir metin girin.');
      return;
    }
    setIsLoading(true);
    setAreQuestionsLoading(true); // Sorular yüklenmeye başlıyor
    setError('');
    setResult(null);
    setUserAnswers({});
    setShowResults(false);
    
    try {
      // 1. ADIM: Sadece özet ve kelimeleri al (HIZLI)
      const initialResult = await getReadingSummaryAndVocab(text);
      setResult(initialResult); // Özet ve kelimeler ekranda anında görünür
      trackAction('reading');
      
      // 2. ADIM: Arka planda soruları al (DAHA YAVAŞ AMA KULLANICIYI BEKLETMEZ)
      const questionsResult = await getReadingQuestions(text);
      // Gelen soruları mevcut sonuca ekle
      setResult(prevResult => {
        if (!prevResult) return null; // Eğer ilk istek başarısız olduysa, birleştirme
        return { ...prevResult, questions: questionsResult.questions };
      });
      
    } catch (e: any) {
      setError(e.message || 'Metin analizi sırasında bir hata oluştu.');
    } finally {
      setIsLoading(false); // Ana yükleyici bitti
      setAreQuestionsLoading(false); // Soru yükleyici bitti
    }
  };
  
  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleCheckAnswers = () => {
    setShowResults(true);
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Input Section */}
      <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-text-primary">Okuma Pratiği</h2>
        <p className="mb-4 text-text-secondary">
          Bir İngilizce okuma parçasını aşağıya yapıştırın. Yapay zeka metni analiz edip Türkçe özetini çıkaracak, anahtar kelimeleri listeleyecek ve anlama soruları üretecektir.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="İngilizce metni buraya yapıştırın..."
          className="w-full h-64 p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none text-text-primary resize-y"
          disabled={isLoading}
        />
        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="mt-4 w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? 'Analiz Ediliyor...' : 'Metni Analiz Et'}
        </button>
      </div>

      {isLoading && <Loader />}
      <ErrorMessage message={error} />

      {/* Results Section */}
      {result && (
        <div className="mt-6 space-y-6">
          {/* Summary Section */}
          <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-brand-primary mb-3">Türkçe Özet</h3>
            <p className="text-text-secondary">{result.summary}</p>
          </div>

          {/* Vocabulary Section */}
          <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-brand-primary mb-3">Anahtar Kelimeler</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(result.vocabulary || []).map((item, index) => (
                <li key={index} className="bg-gray-700 p-3 rounded-md flex justify-between items-center">
                  <div>
                    <span className="font-bold text-text-primary">{item.word}:</span>
                    <span className="text-text-secondary ml-2">{item.meaning}</span>
                  </div>
                  <button
                    onClick={() => handleToggleSaveWord(item.word, item.meaning)}
                    className="text-xl p-2 rounded-full hover:bg-gray-600 transition-colors"
                    title={isWordSaved(item.word) ? 'Kelimeyi Kaldır' : 'Kelimeyi Kaydet'}
                  >
                    {isWordSaved(item.word) ? '✅' : '🔖'}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Questions Section */}
          <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-brand-primary mb-3">Anlama Soruları</h3>
            {areQuestionsLoading ? (
              <div className="flex items-center text-text-secondary p-4">
                {/* Loader'a `small` prop'u gönderdiğinizi varsayıyorum */}
                <Loader /> 
                <span className="ml-3">Sorular oluşturuluyor...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {(result.questions || []).map((q, index) => (
                  <div key={index}>
                    <p className="font-semibold text-text-primary mb-4 whitespace-pre-wrap"><span className="text-brand-primary">{index + 1}.</span> {q.question}</p>
                    <div className="space-y-3">
                      {(q.options || []).map(opt => {
                        const isSelected = userAnswers[index] === opt.key;
                        const isCorrect = opt.key === q.correctAnswer;
                        let baseClass = "flex items-center p-3 rounded-md transition-all duration-200 border-2";
                        let stateClass = "border-transparent bg-gray-700 hover:bg-gray-600 cursor-pointer";

                        if (showResults) {
                          stateClass = "border-transparent bg-gray-800 text-gray-400";
                          if (isCorrect) stateClass = "border-green-500 bg-green-900/50 text-white";
                          else if (isSelected && !isCorrect) stateClass = "border-red-500 bg-red-900/50 text-white";
                        }

                        return (
                          <label key={opt.key} className={`${baseClass} ${stateClass}`}>
                            <input
                              type="radio"
                              name={`question-${index}`}
                              value={opt.key}
                              checked={isSelected}
                              onChange={() => handleAnswerChange(index, opt.key)}
                              disabled={showResults}
                              className="w-4 h-4 text-brand-primary bg-gray-600 border-gray-500 focus:ring-brand-primary ring-offset-bg-secondary hidden"
                            />
                            <span className={`font-bold mr-3 ${showResults && isCorrect ? 'text-green-400' : showResults && isSelected ? 'text-red-400' : 'text-brand-primary'}`}>{opt.key})</span>
                            <span>{opt.value}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Soru yüklenmesi bittiyse ve sorular varsa butonu göster */}
            {!areQuestionsLoading && result.questions && result.questions.length > 0 && !showResults && (
              <button onClick={handleCheckAnswers} className="mt-6 w-full bg-brand-secondary hover:bg-brand-primary text-white font-bold py-3 px-4 rounded-md transition duration-300">
                Cevapları Kontrol Et
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingPractice;
