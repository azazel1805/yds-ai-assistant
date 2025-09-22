
import React, { useState, useEffect, useMemo } from 'react';
import { useVocabulary } from '../context/VocabularyContext';

interface QuizQuestion {
  word: string;
  correctMeaning: string;
  options: string[];
}

const VocabularyTrainer: React.FC = () => {
  const { vocabularyList, removeWord } = useVocabulary();
  
  // Shared state
  const [mode, setMode] = useState<'flashcard' | 'quiz'>('flashcard');

  // Flashcard state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);

  // Utility to shuffle an array
  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Memoize shuffled list for quiz generation
  const shuffledVocabulary = useMemo(() => shuffleArray([...vocabularyList]), [vocabularyList]);

  // Reset states when vocabulary list changes
  useEffect(() => {
    // Flashcard reset
    if (currentCardIndex >= vocabularyList.length) {
        setCurrentCardIndex(0);
    }
    setIsFlipped(false);
    
    // Quiz reset
    setQuizQuestions([]);
    setShowResults(false);
    setUserAnswers({});
    setCurrentQuestionIndex(0);

  }, [vocabularyList, currentCardIndex]);

  // --- Flashcard Logic ---
  const handleNextCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex(prev => (prev + 1) % vocabularyList.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex(prev => (prev - 1 + vocabularyList.length) % vocabularyList.length);
  };
  
  const currentItem = vocabularyList[currentCardIndex];

  // --- Quiz Logic ---
  const startQuiz = () => {
    if (vocabularyList.length < 4) return;
    
    const questions = shuffledVocabulary.map(correctItem => {
        const distractors = shuffleArray(vocabularyList.filter(item => item.id !== correctItem.id))
            .slice(0, 3)
            .map(item => item.meaning);
        
        const options = shuffleArray([correctItem.meaning, ...distractors]);

        return {
            word: correctItem.word,
            correctMeaning: correctItem.meaning,
            options,
        };
    });

    setQuizQuestions(questions);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setShowResults(false);
  };
  
  const handleAnswerSelect = (answer: string) => {
    setUserAnswers(prev => ({ ...prev, [currentQuestionIndex]: answer }));
  };

  const calculateScore = () => {
    return quizQuestions.reduce((score, question, index) => {
        return userAnswers[index] === question.correctMeaning ? score + 1 : score;
    }, 0);
  };

  if (vocabularyList.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-2">Kelime Listeniz Boş</h2>
        <p className="text-text-secondary">Sözlük veya Okuma Pratiği sayfalarından kelime ekleyerek antrenmana başlayın.</p>
      </div>
    );
  }

  const renderFlashcardMode = () => (
    <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold text-text-primary mb-4 text-center">Kelime Kartları ({currentCardIndex + 1} / {vocabularyList.length})</h3>
      <div 
        className="relative w-full h-64 bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer text-center p-4" 
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ perspective: '1000px' }}
      >
        <div 
          className={`absolute w-full h-full transition-transform duration-500 rounded-lg flex items-center justify-center p-4`} 
          style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          <div className="absolute w-full h-full bg-brand-primary rounded-lg flex items-center justify-center" style={{ backfaceVisibility: 'hidden' }}>
            <h4 className="text-4xl font-bold text-white capitalize">{currentItem.word}</h4>
          </div>
          <div className="absolute w-full h-full bg-brand-secondary rounded-lg flex items-center justify-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <p className="text-2xl text-white">{currentItem.meaning}</p>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mt-4">
        <button onClick={handlePrevCard} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-md">Önceki</button>
        <button onClick={handleNextCard} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-md">Sonraki</button>
      </div>
    </div>
  );

  const renderQuizMode = () => {
    if (showResults) return renderQuizResults();
    if (quizQuestions.length > 0) return renderQuizQuestion();
    return renderQuizStart();
  };
  
  const renderQuizStart = () => (
      <div className="text-center">
          <h3 className="text-xl font-bold text-text-primary mb-2">Kelime Testi</h3>
          <p className="text-text-secondary mb-6">Kaydettiğiniz kelimelerle bilginizi test etmeye hazır mısınız?</p>
          <button
              onClick={startQuiz}
              disabled={vocabularyList.length < 4}
              className="w-full sm:w-auto px-8 py-3 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
              Testi Başlat
          </button>
          {vocabularyList.length < 4 && (
              <p className="text-xs text-yellow-400 mt-2">Testi başlatmak için en az 4 kelime kaydetmeniz gerekir.</p>
          )}
      </div>
  );
  
  const renderQuizQuestion = () => {
    const question = quizQuestions[currentQuestionIndex];
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-text-primary">Kelime Testi</h3>
            <span className="text-sm font-semibold text-text-secondary">Soru {currentQuestionIndex + 1} / {quizQuestions.length}</span>
        </div>
        <div className="text-center bg-gray-700 p-6 rounded-lg mb-6">
            <p className="text-text-secondary text-sm">Aşağıdaki kelimenin anlamı nedir?</p>
            <h4 className="text-3xl font-bold text-brand-primary capitalize mt-2">{question.word}</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {question.options.map((option, index) => {
                const isSelected = userAnswers[currentQuestionIndex] === option;
                return (
                    <button 
                        key={index} 
                        onClick={() => handleAnswerSelect(option)}
                        className={`p-4 rounded-md text-left transition-colors duration-200 border-2 ${
                            isSelected 
                            ? 'bg-brand-secondary border-brand-primary text-white' 
                            : 'bg-gray-700 border-transparent hover:bg-gray-600'
                        }`}
                    >
                        {option}
                    </button>
                );
            })}
        </div>
        <div className="flex justify-between items-center mt-6">
            <button 
                onClick={() => setCurrentQuestionIndex(p => p - 1)} 
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"
            >
                Önceki
            </button>
            {currentQuestionIndex < quizQuestions.length - 1 ? (
                <button onClick={() => setCurrentQuestionIndex(p => p + 1)} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-md">Sonraki</button>
            ) : (
                <button onClick={() => setShowResults(true)} className="px-6 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-md">Testi Bitir</button>
            )}
        </div>
      </div>
    );
  };
  
  const renderQuizResults = () => {
      const score = calculateScore();
      return (
        <div className="space-y-6">
          <div className="text-center border-b border-gray-700 pb-4">
              <h3 className="text-2xl font-bold text-brand-primary">Test Sonucu</h3>
              <p className="text-4xl font-bold my-4">{score} / {quizQuestions.length}</p>
              <p className="text-text-secondary">{score > quizQuestions.length / 2 ? "Harika iş! 🎉" : "Biraz daha pratik yapmaya ne dersin?"}</p>
          </div>
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
            {quizQuestions.map((q, index) => {
                const userAnswer = userAnswers[index];
                const isCorrect = userAnswer === q.correctMeaning;
                return (
                    <div key={index} className={`p-3 rounded-md ${isCorrect ? 'bg-green-900/40' : 'bg-red-900/40'}`}>
                        <p className="font-bold capitalize text-text-primary">{index + 1}. {q.word}</p>
                        {!isCorrect && userAnswer && <p className="text-sm text-red-300">Senin Cevabın: {userAnswer}</p>}
                        <p className="text-sm text-green-300">Doğru Cevap: {q.correctMeaning}</p>
                    </div>
                );
            })}
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={startQuiz} className="flex-1 px-6 py-3 bg-brand-secondary hover:bg-brand-primary text-white font-bold rounded-md transition-colors">Tekrar Dene</button>
            <button onClick={() => setMode('flashcard')} className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-md">Kartlara Dön</button>
          </div>
        </div>
      );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-text-primary">Kelime Antrenörü</h2>
        <p className="text-text-secondary mt-1">Kaydettiğiniz kelimelerle pratik yapın veya test çözün.</p>
      </div>
      
      {/* Mode Toggler */}
       <div className="flex justify-center bg-bg-secondary p-1 rounded-lg shadow-inner max-w-xs mx-auto">
          <button 
            onClick={() => setMode('flashcard')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${mode === 'flashcard' ? 'bg-brand-primary text-white' : 'text-text-secondary hover:bg-gray-700'}`}
          >
            Kelime Kartları
          </button>
          <button 
            onClick={() => setMode('quiz')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${mode === 'quiz' ? 'bg-brand-primary text-white' : 'text-text-secondary hover:bg-gray-700'}`}
          >
            Test Modu
          </button>
      </div>

      <div className="bg-bg-secondary p-6 rounded-lg shadow-lg min-h-[350px] flex flex-col justify-center">
        {mode === 'flashcard' ? renderFlashcardMode() : renderQuizMode()}
      </div>
      
      {/* Word List Management */}
      <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold text-text-primary mb-4">Kaydedilen Kelimeler ({vocabularyList.length})</h3>
        <ul className="space-y-3 max-h-96 overflow-y-auto">
          {vocabularyList.map(item => (
            <li key={item.id} className="flex justify-between items-center bg-gray-700 p-3 rounded-md">
              <div>
                <p className="font-semibold capitalize text-text-primary">{item.word}</p>
                <p className="text-sm text-text-secondary">{item.meaning}</p>
              </div>
              <button
                onClick={() => removeWord(item.word)}
                className="text-red-400 hover:text-red-600 font-bold p-2 text-xl"
                title="Kelimeyi Sil"
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default VocabularyTrainer;
