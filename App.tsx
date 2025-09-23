
import React, { useState, ReactNode } from 'react';
import Dashboard from './pages/Dashboard';
import QuestionAnalyzer from './pages/QuestionAnalyzer';
import AITutor from './pages/AITutor';
import Dictionary from './pages/Dictionary';
import History from './pages/History';
import { HistoryProvider } from './context/HistoryContext';
import { AnalyzeIcon, DictionaryIcon, HistoryIcon, DashboardIcon, LogoutIcon, TutorIcon, ReadingIcon, WritingIcon, VocabularyIcon, MenuIcon, CloseIcon, DeconstructIcon, NewsIcon } from './components/icons/Icons';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ReadingPractice from './pages/ReadingPractice';
import WritingAssistant from './pages/WritingAssistant';
import VocabularyTrainer from './pages/VocabularyTrainer';
import PassageDeconstruction from './pages/PassageDeconstruction';
import NewsReader from './pages/NewsReader';


type Tab = 'dashboard' | 'analyzer' | 'tutor' | 'reading' | 'writing' | 'deconstruction' | 'news' | 'dictionary' | 'vocabulary' | 'history';

const App: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!user) {
    return <LoginPage />;
  }

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'analyzer', label: 'Soru Analisti', icon: <AnalyzeIcon /> },
    { id: 'tutor', label: 'AI Eğitmen', icon: <TutorIcon /> },
    { id: 'reading', label: 'Okuma Pratiği', icon: <ReadingIcon /> },
    { id: 'writing', label: 'Yazma Pratiği', icon: <WritingIcon /> },
    { id: 'deconstruction', label: 'Metin Analizi', icon: <DeconstructIcon /> },
    { id: 'news', label: 'Etkileşimli Gündem', icon: <NewsIcon /> },
    { id: 'dictionary', label: 'Sözlük', icon: <DictionaryIcon /> },
    { id: 'vocabulary', label: 'Kelime Antrenörü', icon: <VocabularyIcon /> },
    { id: 'history', label: 'Geçmiş', icon: <HistoryIcon /> },
  ];

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  const renderContent = (): ReactNode => {
      switch (activeTab) {
          case 'dashboard':
              return <Dashboard onNavigate={handleTabClick} />;
          case 'analyzer':
              return <QuestionAnalyzer />;
          case 'tutor':
              return <AITutor />;
          case 'reading':
              return <ReadingPractice />;
          case 'writing':
              return <WritingAssistant />;
          case 'deconstruction':
              return <PassageDeconstruction />;
          case 'news':
              return <NewsReader />;
          case 'dictionary':
              return <Dictionary />;
          case 'vocabulary':
              return <VocabularyTrainer />;
          case 'history':
              return <History />;
          default:
              return <Dashboard onNavigate={handleTabClick} />;
      }
  };

  return (
    <HistoryProvider>
       <div className="min-h-screen bg-bg-primary font-sans">
            <header className="bg-bg-secondary shadow-md sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <h1 className="text-xl font-bold text-text-primary tracking-tight">YDS AI Assistant</h1>
                        <div className="hidden md:flex items-center gap-4">
                            <span className="text-sm text-text-secondary">Welcome, <strong className="text-text-primary">{user}</strong></span>
                             <button onClick={logout} className="flex items-center gap-2 text-sm text-text-secondary hover:text-brand-primary transition-colors duration-200" title="Logout">
                                <LogoutIcon />
                                Çıkış Yap
                            </button>
                        </div>
                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                                <span className="sr-only">Open main menu</span>
                                {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
                            </button>
                        </div>
                    </div>
                    <nav className="hidden md:flex space-x-1 border-b border-gray-700 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors duration-200 focus:outline-none ${activeTab === tab.id
                                    ? 'bg-bg-secondary text-brand-primary border-b-2 border-brand-primary'
                                    : 'text-text-secondary hover:bg-gray-700 hover:text-text-primary'
                                  }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabClick(tab.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium ${activeTab === tab.id
                                        ? 'bg-brand-primary text-white'
                                        : 'text-text-secondary hover:bg-gray-700 hover:text-white'
                                      }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="pt-4 pb-3 border-t border-gray-700">
                            <div className="flex items-center px-5">
                                <p className="text-text-secondary">Signed in as <strong className="text-white">{user}</strong></p>
                            </div>
                            <div className="mt-3 px-2 space-y-1">
                                <button
                                    onClick={() => { logout(); setIsMenuOpen(false); }}
                                    className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-text-secondary hover:bg-gray-700 hover:text-white"
                                >
                                  <LogoutIcon />
                                  Çıkış Yap
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                {renderContent()}
            </main>
        </div>
    </HistoryProvider>
  );
};

export default App;
