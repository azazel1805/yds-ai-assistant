import React, { createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { useAuth } from './AuthContext';
import { ChallengeState, ChallengeType, DailyChallenge } from '../types';
import { QUESTION_TYPES } from '../constants';

const ALL_CHALLENGES: Omit<DailyChallenge, 'id' | 'progress' | 'completed'>[] = [
    { description: "Soru Analisti'nde 1 soru analiz et.", type: 'analyze', target: 1 },
    { description: "Sözlük'te 3 yeni kelime ara.", type: 'dictionary', target: 3 },
    { description: "AI Eğitmen Onur'a bir soru sor.", type: 'tutor', target: 1 },
    { description: "Bir okuma parçasını analiz et.", type: 'reading', target: 1 },
    { description: "Yazma Asistanı'nda bir metin analizi yap.", type: 'writing', target: 1 },
    ...Object.values(QUESTION_TYPES).map(type => ({
        description: `1 adet '${type}' sorusu analiz et.`,
        type: 'analyze' as ChallengeType,
        target: 1,
        meta: { questionType: type }
    }))
];

const getTodayDateString = () => new Date().toISOString().split('T')[0];

interface ChallengeContextType {
    challengeState: ChallengeState;
    trackAction: (type: ChallengeType, details?: { questionType?: string }) => void;
}

const ChallengeContext = createContext<ChallengeContextType | undefined>(undefined);

export const ChallengeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const challengeKey = user ? `challenge-state-${user}` : 'challenge-state-guest';
    
    const initialState: ChallengeState = {
        currentChallenge: null,
        lastCompletedDate: null,
        streak: 0,
    };
    
    const [challengeState, setChallengeState] = useLocalStorage<ChallengeState>(challengeKey, initialState);

    const generateNewChallenge = useCallback(() => {
        const randomIndex = Math.floor(Math.random() * ALL_CHALLENGES.length);
        const challengeTemplate = ALL_CHALLENGES[randomIndex];
        const newChallenge: DailyChallenge = {
            ...challengeTemplate,
            id: new Date().toISOString(),
            progress: 0,
            completed: false,
        };
        return newChallenge;
    }, []);
    
    useEffect(() => {
        const today = getTodayDateString();
        // If there's no challenge OR the challenge is from a previous day
        if (!challengeState.currentChallenge || (challengeState.currentChallenge.id.split('T')[0] !== today)) {
             setChallengeState(prev => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayString = yesterday.toISOString().split('T')[0];
                
                // Reset streak if a day was missed
                const streak = prev.lastCompletedDate === yesterdayString ? prev.streak : 0;

                return {
                    ...prev,
                    streak,
                    currentChallenge: generateNewChallenge()
                };
             });
        }
    }, [user, challengeState.currentChallenge, challengeState.lastCompletedDate, setChallengeState, generateNewChallenge]);


    const trackAction = (type: ChallengeType, details?: { questionType?: string }) => {
        setChallengeState(prev => {
            const { currentChallenge } = prev;
            if (!currentChallenge || currentChallenge.completed) {
                return prev;
            }

            // Check if the action matches the challenge type
            const typeMatches = currentChallenge.type === type;
            // Check if meta conditions (like questionType) match
            const metaMatches = !currentChallenge.meta || 
                                (currentChallenge.meta.questionType === details?.questionType);

            if (typeMatches && metaMatches) {
                const newProgress = currentChallenge.progress + 1;
                const isCompleted = newProgress >= currentChallenge.target;
                
                const updatedChallenge: DailyChallenge = {
                    ...currentChallenge,
                    progress: newProgress,
                    completed: isCompleted,
                };
                
                if (isCompleted) {
                    return {
                        currentChallenge: updatedChallenge,
                        lastCompletedDate: getTodayDateString(),
                        streak: prev.streak + 1
                    };
                }
                
                return { ...prev, currentChallenge: updatedChallenge };
            }

            return prev;
        });
    };

    return (
        <ChallengeContext.Provider value={{ challengeState, trackAction }}>
            {children}
        </ChallengeContext.Provider>
    );
};

export const useChallenge = (): ChallengeContextType => {
    const context = useContext(ChallengeContext);
    if (context === undefined) {
        throw new Error('useChallenge must be used within a ChallengeProvider');
    }
    return context;
};