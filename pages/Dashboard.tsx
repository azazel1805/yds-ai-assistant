
import React, { useState, useMemo } from 'react'; 
import { useHistory } from '../context/HistoryContext';
import { getPersonalizedFeedback } from '../services/geminiService';
import { PersonalizedFeedback } from '../types';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { useChallenge } from '../context/ChallengeContext';
import { useVocabulary } from '../context/VocabularyContext';
import { VocabularyIcon } from '../components/icons/Icons';
// DÜZELTME 2: Sınav tarihlerini içeren veri dosyası import edildi.
import { ydsExamDates } from '../data/examDates';


interface ChartData {
  [key: string]: number;
}

interface DashboardProps {
    onNavigate: (tab: 'vocabulary' | 'dictionary') => void;
}

const UpcomingExams = () => {
  const upcomingExams = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day for comparison

    return ydsExamDates
      .filter(exam => new Date(exam.examDate) >= today)
      .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
      .slice(0, 3);
  }, []);

  if (upcomingExams.length === 0) {
    return null; // Don't render if no upcoming exams are found in the data
  }

  const calculateDaysLeft = (dateString: string) => {
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold text-text-primary mb-4">Yaklaşan YDS Sınavları</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {upcomingExams.map(exam => (
          <div key={exam.name} className="bg-gray-700 p-4 rounded-lg border-l-4 border-brand-primary flex flex-col">
            <h4 className="font-bold text-text-primary">{exam.name}</h4>
            <div className="text-sm text-text-secondary mt-2 space-y-1 flex-grow">
              <p><strong>Sınav Tarihi:</strong> {formatDate(exam.examDate)}</p>
              <p><strong>Başvurular:</strong> {formatDate(exam.applicationStartDate)} - {formatDate(exam.applicationEndDate)}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-600 text-center">
              <p className="text-2xl font-bold text-brand-primary">{calculateDaysLeft(exam.examDate)}</p>
              <p className="text-xs text-text-secondary uppercase tracking-wider">Gün Kaldı</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { history } = useHistory();
  const { challengeState } = useChallenge();
  const { vocabularyList } = useVocabulary();
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedback, setFeedback] = useState<PersonalizedFeedback | null>(null);

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
        <UpcomingExams />
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Toplam Analiz" value={totalAnalyses} />
          <StatCard title="Farklı Soru Tipi" value={Object.keys(questionTypes).length} />
          <StatCard title="Farklı Zorluk Seviyesi" value={Object.keys(difficultyLevels).length} />
      </div>

      <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold text-text-primary mb-2">Kişiselleştirilmiş Çalışma Planı</h3>
        <p className="text-text-secondary text-sm mb-4">Geçmiş analizlerinize dayanarak yapay zekadan kişisel çalışma önerileri alın.</p>
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
                    <h4 className="font-semibold text-brand-primary">Odaklanılacak Konular:</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {feedback.weakTopics.map(topic => (
                            <div
                                key={topic.questionType}
                                className="px-4 py-2 bg-gray-700 text-brand-primary rounded-full text-sm"
                            >
                                {topic.topic}
                            </div>
                        ))}
                    </div>
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
