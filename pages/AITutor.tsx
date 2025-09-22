import React, { useState, useEffect, useRef } from 'react';
import { sendTutorMessage } from '../services/geminiService';
import { ChatMessage } from '../types';
import ErrorMessage from '../components/ErrorMessage';
import { SendIcon } from '../components/icons/Icons';
import { useChallenge } from '../context/ChallengeContext';


const AITutor: React.FC = () => {
    const [history, setHistory] = useState<ChatMessage[]>([
        { role: 'model', text: 'Merhaba! Ben Onur, senin kişisel AI İngilizce eğitmenin. YDS ve YÖKDİL yolculuğunda sana nasıl yardımcı olabilirim?' }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const { trackAction } = useChallenge();

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [history]);

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
            // Pass the current history (before adding the new user message) and the new message itself
            const responseText = await sendTutorMessage(history, currentInput);
            setHistory(prev => [...prev, { role: 'model', text: responseText }]);
        } catch (e: any) {
            setError(e.message || 'Failed to get response from AI Tutor.');
            // Remove the user message on error to allow them to try again
            setHistory(prev => prev.filter(msg => msg !== userMessage));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
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
                 {isLoading && (
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
    );
};

export default AITutor;