
import React, { useState, useEffect } from 'react';
import { generateListeningTask } from '../services/geminiService';
import { ListeningTask } from '../types';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { useChallenge } from '../context/ChallengeContext';
import { DIFFICULTY_LEVELS } from '../constants';
import { SpeakerIcon } from '../components/icons/Icons';

const ListeningPractice: React.FC = () => {
  const [difficulty, setDifficulty] = useState(DIFFICULTY_LEVELS[1]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [task, setTask] = useState<ListeningTask | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const { trackAction } = useChallenge();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const handleGenerateTask = async () => {
    setIsLoading(true);
    setError('');
    setTask(null);
    setUserAnswers({});
    setShowResults(false);
    try {
      const resultText = await generateListeningTask(difficulty);
      const resultJson: ListeningTask = JSON.parse(resultText);
      setTask(resultJson);
      trackAction('listening');
    } catch (e: any) {
      setError(e.message || 'Dinleme görevi oluşturulurken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudio = () => {
    if (!task?.script) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(task.script);
    const femaleVoice = voices.find(voice => voice.lang === 'en-US' && /female/i.test(voice.name));
    utterance.voice = femaleVoice || voices.find(voice => voice.lang === 'en-US') || null;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleCheckAnswers = () => {
    setShowResults(true);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-text-primary">Dinleme Pratiği</h2>
        <p className="mb-4 text-text-secondary">
          Zorluk seviyesi seçin ve yapay zekanın sizin için bir dinleme görevi oluşturmasını sağlayın.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-text-secondary mb-1">Zorluk Seviyesi</label>
                <select 
                    value={difficulty} 
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none text-text-primary"
                    disabled={isLoading}
                >
                    {DIFFICULTY_LEVELS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
            <button
              onClick={handleGenerateTask}
              disabled={isLoading}
              className="w-full sm:w-auto mt-2 sm:mt-0 self-end bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Oluşturuluyor...' : 'Görev Oluştur'}
            </button>
        </div>
      </div>

      {isLoading && <Loader />}
      <ErrorMessage message={error} />

      {task && (
        <div className="mt-6 space-y-6">
          <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-brand-primary mb-3">Dinleme Metni</h3>
            <div className="flex items-center gap-4 bg-gray-700 p-4 rounded-md">
                <button 
                    onClick={handlePlayAudio}
                    className="text-brand-primary hover:text-brand-secondary transition-colors text-3xl p-2 bg-gray-800 rounded-full"
                    title="Metni Dinle"
                >
                    <SpeakerIcon />
                </button>
                <p className="text-text-secondary italic">Metni dinlemek için oynat butonuna tıklayın.</p>
            </div>
          </div>
          
          <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-brand-primary mb-3">Anlama Soruları</h3>
            <div className="space-y-6">
              {task.questions.map((q, index) => (
                <div key={index}>
                  <p className="font-semibold text-text-primary mb-4"><span className="text-brand-primary">{index + 1}.</span> {q.question}</p>
                  <div className="space-y-3">
                    {q.options.map(opt => {
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
            {!showResults && task.questions.length > 0 && (
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

export default ListeningPractice;
