import React, { useState, useMemo } from 'react';
import { useHistory } from '../context/HistoryContext';
import { getPersonalizedFeedback } from '../services/geminiService';
import { PersonalizedFeedback, Achievement } from '../types';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { GeneratorConfig } from './QuestionGenerator';
import { useChallenge } from '../context/ChallengeContext';
import { useVocabulary } from '../context/VocabularyContext';
import { VocabularyIcon } from '../components/icons/Icons';
import { allAchievements } from '../achievements';


interface ChartData {
  [key: string]: number;
}

interface DashboardProps {
    onNavigateToGenerator: (config: GeneratorConfig) => void;
    onNavigate: (tab: 'vocabulary' | 'dictionary' | 'generator' | 'analyzer') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigateToGenerator, onNavigate }) => {
  const { history } = useHistory();
  const { challengeState } = useChallenge();
  const { vocabularyList } = useVocabulary();
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedback, setFeedback] = useState<PersonalizedFeedback | null>(null);

  const unlockedAchievements = useMemo(() => {
    return allAchievements.filter(ach => ach.isUnlocked(history, vocabularyList, challengeState));
  }, [history, vocabularyList, challengeState]);

  const totalAnalyses = history.length;
  const questionTypes: ChartData = {};
  const difficultyLevels: ChartData = {};

  history.forEach(item => {
    const type = item.analysis.soruTipi || 'Bilinmiyor';
    const difficulty = item.analysis.zorlukSeviyesi || 'Bilinmiyor';
    
    questionTypes[type] = (questionTypes[type] || 0) + 1;
    difficultyLevels[difficulty] = (difficultyLevels[difficulty] || 0) + 1;
  });
  
  const sortedTypes = Object.entries(questionTypes).sort(([, a], [, b]) => b - a);
  const sortedDifficulties = Object.entries(difficultyLevels).sort(([, a], [, b]) => b - a);
  
  const handleGetFeedback = async () => {
    setIsLoadingFeedback(true);
    setFeedbackError('');
    setFeedback(null);
    try {
        const resultText = await getPersonalizedFeedback(history);
        const resultJson: PersonalizedFeedback = JSON.parse(resultText);
        setFeedback(resultJson);
    } catch(e: any) {
        setFeedbackError(e.message || "Kişiselleştirilmiş geri bildirim alınamadı.");
    } finally {
        setIsLoadingFeedback(false);
    }
  }

  const DailyChallengeDisplay = () => {
    const { currentChallenge, streak } = challengeState;
    if (!currentChallenge) return null;

    const progressPercentage = Math.min((currentChallenge.progress / currentChallenge.target) * 100, 100);

    return (
      <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-text-primary">Günün Görevi</h3>
          <div className="flex items-center gap-2 text-yellow-400">
            <span className="text-2xl">🔥</span>
            <span className="font-bold text-lg">{streak} Günlük Seri</span>
          </div>
        </div>
        
        {currentChallenge.completed ? (
          <div className="text-center bg-green-900/50 border border-green-700 p-4 rounded-md">
            <p className="font-bold text-green-300">🎉 Harika! Bugünkü görevi tamamladın. Yarın görüşürüz!</p>
          </div>
        ) : (
          <div>
            <p className="text-text-secondary mb-3">{currentChallenge.description}</p>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div 
                className="bg-brand-primary h-4 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-right text-sm text-text-secondary mt-1">{currentChallenge.progress} / {currentChallenge.target}</p>
          </div>
        )}
      </div>
    );
  };

  if (history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <DailyChallengeDisplay />
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold mb-2">Dashboard Boş</h2>
          <p className="text-text-secondary">Henüz hiçbir soru analizi yapmadınız. Analiz yaptıkça istatistikleriniz burada görünecektir.</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value }: { title: string, value: number | string }) => (
    <div className="bg-bg-secondary p-6 rounded-lg shadow-lg text-center">
      <h3 className="text-text-secondary text-sm font-medium uppercase tracking-wider">{title}</h3>
      <p className="text-3xl font-bold text-brand-primary mt-2">{value}</p>
    </div>
  );

  const BarChart = ({ title, data }: { title: string, data: [string, number][] }) => {
    const total = data.reduce((sum, [, value]) => sum + value, 0);
    if (total === 0) return null;

    return (
        <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold text-text-primary mb-4">{title}</h3>
            <div className="space-y-3">
                {data.map(([label, value]) => {
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    return (
                        <div key={label}>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="font-medium text-text-secondary truncate pr-2">{label}</span>
                                <span className="font-bold text-text-primary">{value}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                <div className="bg-brand-primary h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-text-primary">Dashboard</h2>
        <p className="text-text-secondary mt-1">Genel performans özetiniz.</p>
      </div>

      <DailyChallengeDisplay />
      
      <div className="bg-bg-secondary p-6 rounded-lg shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-4">
          <div className="text-4xl text-brand-primary hidden sm:block">
            <VocabularyIcon />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">Kelime Antrenörü</h3>
            <p className="text-text-secondary text-sm">
              {vocabularyList.length > 0
                ? `Kaydedilmiş ${vocabularyList.length} kelime ile pratik yapmaya hazırsın.`
                : 'Henüz kaydedilmiş kelimen yok. Hadi başlayalım!'}
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate(vocabularyList.length > 0 ? 'vocabulary' : 'dictionary')}
          className="w-full sm:w-auto px-6 py-2 bg-brand-secondary text-white rounded-md hover:bg-brand-primary transition-colors duration-200 text-sm font-bold shrink-0"
        >
          {vocabularyList.length > 0 ? 'Pratik Yap' : 'Kelime Ekle'}
        </button>
      </div>

       <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold text-text-primary mb-4">Başarımlar</h3>
        {unlockedAchievements.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {unlockedAchievements.map(ach => (
              <div key={ach.id} className="text-center p-3 bg-gray-700 rounded-lg transform hover:scale-105 transition-transform duration-200" title={ach.description}>
                <div className="text-4xl">{ach.icon}</div>
                <p className="text-xs font-bold mt-2 h-8 flex items-center justify-center">{ach.title}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-secondary text-sm">Henüz bir başarım kazanmadın. Çalışmaya devam et!</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Toplam Analiz" value={totalAnalyses} />
          <StatCard title="Farklı Soru Tipi" value={Object.keys(questionTypes).length} />
          <StatCard title="Farklı Zorluk Seviyesi" value={Object.keys(difficultyLevels).length} />
      </div>

      <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold text-text-primary mb-2">Kişiselleştirilmiş Çalışma Planı</h3>
        <p className="text-text-secondary text-sm mb-4">Geçmiş analizlerinize dayanarak yapay zekadan 3 günlük kişisel çalışma planı alın.</p>
        <button 
            onClick={handleGetFeedback}
            disabled={isLoadingFeedback}
            className="bg-brand-secondary hover:bg-brand-primary text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
            {isLoadingFeedback ? 'Analiz Ediliyor...' : 'Performansımı Analiz Et'}
        </button>
        {isLoadingFeedback && <Loader />}
        <ErrorMessage message={feedbackError} />
        {feedback && (
            <div className="mt-4 border-t border-gray-700 pt-4 space-y-4">
                <div>
                    <h4 className="font-semibold text-brand-primary">AI Koçunuzun Önerisi:</h4>
                    <p className="text-text-primary mt-1 text-sm">{feedback.recommendation}</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-brand-primary mb-2">3 Günlük Odaklanma Planı:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {feedback.studyPlan.sort((a,b) => a.day - b.day).map(day => (
                            <div key={day.day} className="bg-gray-700 p-4 rounded-lg flex flex-col">
                                <h5 className="font-bold text-text-primary border-b border-gray-600 pb-2 mb-2">📅 Gün {day.day}: <span className="text-brand-primary">{day.focus}</span></h5>
                                <ul className="list-disc list-inside text-sm space-y-1 text-text-secondary flex-grow">
                                    {day.tasks.map((task, index) => <li key={index}>{task}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                    <button onClick={() => onNavigate('analyzer')} className="px-3 py-1 bg-gray-700 text-brand-primary rounded-full hover:bg-brand-secondary hover:text-white text-xs">Soru Analistine Git</button>
                    <button onClick={() => onNavigate('generator')} className="px-3 py-1 bg-gray-700 text-brand-primary rounded-full hover:bg-brand-secondary hover:text-white text-xs">Soru Üreticiye Git</button>
                </div>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BarChart title="Soru Tipi Dağılımı" data={sortedTypes} />
          <BarChart title="Zorluk Seviyesi Dağılımı" data={sortedDifficulties} />
      </div>
    </div>
  );
};

export default Dashboard;
