import React, { useState, useEffect, useRef } from 'react';
import { sendTutorMessage } from '../services/geminiService';
import { ChatMessage } from '../types';
import ErrorMessage from '../components/ErrorMessage';
import { SendIcon } from '../components/icons/Icons';
import { useChallenge } from '../context/ChallengeContext';
import { ydsGrammarRules, GrammarRule } from '../data/grammarRules';

const AITutor: React.FC = () => {
    const [history, setHistory] = useState<ChatMessage[]>([
        { role: 'model', text: 'Merhaba! Ben Onur, senin kişisel AI İngilizce eğitmenin. YDS yolculuğunda sana nasıl yardımcı olabilirim?' }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const { trackAction } = useChallenge();
    const [selectedRule, setSelectedRule] = useState<GrammarRule | null>(null);
    
    // DÜZELTME: Mobil görünüm için daha iyi bir state yönetimi
    const [isGuideCollapsed, setIsGuideCollapsed] = useState(window.innerWidth < 1024);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [history]);

    // DÜZELTME: Pencere boyutu değiştiğinde rehberin durumunu güncelleyen useEffect
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsGuideCollapsed(false); // Masaüstünde her zaman açık
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: userInput };
        const currentInput = userInput;
        
        setIsLoading(true);
        setError('');
        setHistory(prev => [...prev, userMessage]);
        setUserInput('');
        trackAction('tutor');

        try {
            const responseText = await sendTutorMessage(history, currentInput);
            setHistory(prev => [...prev, { role: 'model', text: responseText }]);
        } catch (e: any) {
            setError(e.message || 'Failed to get response from AI Tutor.');
            setHistory(prev => prev.filter(msg => msg !== userMessage));
        } finally {
            setIsLoading(false);
        }
    };

    const GrammarRuleModal = ({ rule, onClose }: { rule: GrammarRule, onClose: () => void }) => (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-bg-secondary rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-brand-primary">{rule.title}</h3>
                    <button onClick={onClose} className="text-text-secondary text-2xl hover:text-white">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                    <div>
                        <h4 className="font-semibold text-text-secondary mb-1">Açıklama</h4>
                        <p className="text-sm text-text-primary bg-gray-700/50 p-3 rounded-md">{rule.explanation}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-text-secondary mb-1">Örnekler</h4>
                        <ul className="space-y-2 text-sm">
                            {rule.examples.map((ex, index) => (
                                <li key={index} className="bg-gray-700/50 p-3 rounded-md">
                                    <p className="font-mono text-text-primary">{ex.en}</p>
                                    <p className="italic text-text-secondary">{ex.tr}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-text-secondary mb-1">YDS İpucu 💡</h4>
                        <p className="text-sm text-yellow-300 bg-yellow-900/30 p-3 rounded-md">{rule.ydsTip}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    // DÜZELTME: Component'in tek ve doğru return bloğu burasıdır.
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
             {selectedRule && <GrammarRuleModal rule={selectedRule} onClose={() => setSelectedRule(null)} />}
            
            {/* Chat UI */}
            <div className="lg:col-span-2 h-[calc(100vh-12rem)] flex flex-col">
                <div className="bg-bg-secondary p-6 rounded-t-lg shadow-lg border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-text-primary">AI Eğitmen: Onur</h2>
                    <p className="text-text-secondary">İngilizce veya sınavlar hakkında aklınıza takılan her şeyi sorun.</p>
                </div>
                <div
                    ref={chatContainerRef}
                    className="flex-grow bg-bg-secondary p-6 overflow-y-auto space-y-4"
                >
                    {history.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && <span className="text-3xl mb-1">🎓</span>}
                            <div
                                className={`max-w-xl p-3 rounded-2xl ${
                                    msg.role === 'user' 
                                    ? 'bg-brand-primary text-white rounded-br-none' 
                                    : 'bg-gray-700 text-text-primary rounded-bl-none'
                                }`}
                            >
                                <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                            </div>
                            {msg.role === 'user' && <span className="text-3xl mb-1">🧑‍🎓</span>}
                        </div>
                    ))}
                    {isLoading && history.length > 0 && history[history.length -1].role === 'user' && (
                        <div className="flex items-end gap-3 justify-start mt-4">
                            <span className="text-3xl mb-1">🎓</span>
                            <div className="max-w-lg p-3 rounded-2xl bg-gray-700 text-text-primary rounded-bl-none">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                    <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-bg-secondary rounded-b-lg shadow-lg">
                    <ErrorMessage message={error} />
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder={isLoading ? 'Onur düşünüyor...' : 'Onur\'a bir mesaj yazın...'}
                            className="flex-grow p-3 bg-gray-700 border border-gray-600 rounded-full focus:ring-2 focus:ring-brand-primary focus:outline-none text-text-primary disabled:opacity-50"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !userInput.trim()}
                            className="bg-brand-primary hover:bg-brand-secondary text-white font-bold w-12 h-12 rounded-full transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                        >
                            <SendIcon />
                        </button>
                    </form>
                </div>
            </div>

            {/* Grammar Guide List */}
            <div className="lg:col-span-1 bg-bg-secondary p-6 rounded-lg shadow-lg h-fit lg:h-[calc(100vh-12rem)] flex flex-col">
                 <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                    <h2 className="text-xl font-bold text-text-primary">Gramer Rehberi</h2>
                    <button 
                        onClick={() => setIsGuideCollapsed(!isGuideCollapsed)}
                        className="lg:hidden text-sm font-semibold bg-gray-700 px-3 py-1 rounded-md hover:bg-gray-600"
                        aria-expanded={!isGuideCollapsed}
                        aria-controls="grammar-guide-content"
                    >
                        {isGuideCollapsed ? 'Göster' : 'Gizle'}
                    </button>
                </div>
                <div 
                    id="grammar-guide-content"
                    className={`flex-grow overflow-y-auto ${isGuideCollapsed ? 'hidden' : 'flex'} lg:flex flex-col`}
                >
                    <p className="text-sm text-text-secondary mb-2">Sık kullanılan YDS gramer kurallarını inceleyin:</p>
                    <ul className="space-y-2">
                        {ydsGrammarRules.map(rule => (
                            <li key={rule.id}>
                                <button
                                    onClick={() => setSelectedRule(rule)}
                                    className="w-full text-left p-3 rounded-md text-sm transition-colors duration-200 bg-gray-700 hover:bg-gray-600 text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                >
                                    {rule.title}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AITutor;
