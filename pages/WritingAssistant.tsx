
import React, { useState } from 'react';
import { getWritingTopic, analyzeWrittenText } from '../services/geminiService';
import { WritingAnalysis } from '../types';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { useChallenge } from '../context/ChallengeContext';


const WritingAssistant: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [text, setText] = useState('');
    const [isLoadingTopic, setIsLoadingTopic] = useState(false);
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
    const [error, setError] = useState('');
    const [analysis, setAnalysis] = useState<WritingAnalysis | null>(null);
    const { trackAction } = useChallenge();


    const handleGetTopic = async () => {
        setIsLoadingTopic(true);
        setError('');
        setAnalysis(null);
        setText('');
        try {
            const newTopic = await getWritingTopic();
            setTopic(newTopic);
        } catch (e: any) {
            setError(e.message || 'Konu alınamadı.');
        } finally {
            setIsLoadingTopic(false);
        }
    };
    
    const handleAnalyze = async () => {
        if (!text.trim() || !topic) {
            setError('Lütfen önce bir konu seçin ve metninizi yazın.');
            return;
        }
        setIsLoadingAnalysis(true);
        setError('');
        setAnalysis(null);
        try {
            const resultText = await analyzeWrittenText(topic, text);
            const resultJson: WritingAnalysis = JSON.parse(resultText);
            setAnalysis(resultJson);
            trackAction('writing');
        } catch (e: any) {
            setError(e.message || 'Metin analizi sırasında bir hata oluştu.');
        } finally {
            setIsLoadingAnalysis(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-2 text-text-primary">Yazma Asistanı</h2>
                <p className="mb-4 text-text-secondary">Yazma becerilerinizi geliştirmek için AI'dan geri bildirim alın.</p>
                <div className="bg-gray-700 p-4 rounded-md">
                    <h3 className="font-semibold text-text-secondary mb-2">Adım 1: Kompozisyon Konusu Alın</h3>
                    <button
                        onClick={handleGetTopic}
                        disabled={isLoadingTopic || isLoadingAnalysis}
                        className="bg-brand-secondary hover:bg-brand-primary text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-500"
                    >
                        {isLoadingTopic ? 'Konu Getiriliyor...' : 'Yeni Konu Getir'}
                    </button>
                    {topic && !isLoadingTopic && (
                        <div className="mt-4 bg-gray-800 p-3 rounded-md">
                            <p className="text-text-primary"><strong className="text-brand-primary">Konu:</strong> {topic}</p>
                        </div>
                    )}
                </div>
            </div>

            {topic && (
                 <div className="bg-bg-secondary p-6 rounded-lg shadow-lg">
                    <h3 className="font-semibold text-text-secondary mb-2">Adım 2: Metninizi Yazın</h3>
                     <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Metninizi buraya yazın..."
                        className="w-full h-64 p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none text-text-primary resize-y"
                        disabled={isLoadingAnalysis}
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoadingAnalysis || !text.trim()}
                        className="mt-4 w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500 flex items-center justify-center"
                    >
                        {isLoadingAnalysis ? 'Analiz Ediliyor...' : 'Metni Analiz Et'}
                    </button>
                 </div>
            )}
            
            {(isLoadingTopic || isLoadingAnalysis) && <Loader />}
            <ErrorMessage message={error} />
            
            {analysis && (
                <div className="bg-bg-secondary p-6 rounded-lg shadow-lg space-y-6">
                    <h2 className="text-xl font-bold text-brand-primary">Analiz Sonuçları</h2>
                    
                    {/* Overall Feedback */}
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">Genel Değerlendirme</h3>
                        <p className="text-text-secondary text-sm bg-gray-700 p-3 rounded-md">{analysis.overallFeedback}</p>
                    </div>

                    {/* Structure and Cohesion */}
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">Yapı ve Tutarlılık</h3>
                        <p className="text-text-secondary text-sm bg-gray-700 p-3 rounded-md">{analysis.structureAndCohesion}</p>
                    </div>
                    
                    {/* Grammar Feedback */}
                    {analysis.grammar && analysis.grammar.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">Gramer Düzeltmeleri</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-left text-gray-300">
                                    <thead className="bg-gray-700 text-xs text-text-secondary uppercase">
                                        <tr>
                                            <th scope="col" className="px-4 py-2">Hata</th>
                                            <th scope="col" className="px-4 py-2">Düzeltme</th>
                                            <th scope="col" className="px-4 py-2">Açıklama</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analysis.grammar.map((item, index) => (
                                            <tr key={index} className="bg-gray-800 border-b border-gray-700">
                                                <td className="px-4 py-2 text-red-400 line-through">{item.error}</td>
                                                <td className="px-4 py-2 text-green-400">{item.correction}</td>
                                                <td className="px-4 py-2">{item.explanation}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Vocabulary Suggestions */}
                    {analysis.vocabulary && analysis.vocabulary.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">Kelime Önerileri</h3>
                             <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-left text-gray-300">
                                    <thead className="bg-gray-700 text-xs text-text-secondary uppercase">
                                        <tr>
                                            <th scope="col" className="px-4 py-2">Orijinal Kelime</th>
                                            <th scope="col" className="px-4 py-2">Öneri</th>
                                            <th scope="col" className="px-4 py-2">Neden</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analysis.vocabulary.map((item, index) => (
                                            <tr key={index} className="bg-gray-800 border-b border-gray-700">
                                                <td className="px-4 py-2 text-yellow-400">{item.original}</td>
                                                <td className="px-4 py-2 text-teal-300">{item.suggestion}</td>
                                                <td className="px-4 py-2">{item.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default WritingAssistant;