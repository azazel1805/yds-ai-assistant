
import { ChatMessage, HistoryItem } from '../types';

// Helper function to call our secure Netlify serverless function
const callGeminiApi = async (action: string, payload: object): Promise<any> => {
  try {
    const response = await fetch('/.netlify/functions/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.error || `Failed to call Gemini API action: ${action}`);
    }
    
    // The serverless function will return the JSON string which was originally `response.text`
    return await response.json();
  } catch (error) {
    console.error(`Error in callGeminiApi for action ${action}:`, error);
    if (error instanceof Error) {
        throw new Error(`A server error occurred: ${error.message}`);
    }
    throw new Error('An unknown server error occurred.');
  }
};

export const analyzeQuestion = async (question: string): Promise<string> => {
  const result = await callGeminiApi('analyzeQuestion', { question });
  return result.text;
};

export const getDictionaryEntry = async (word: string, language: string = 'Turkish'): Promise<string> => {
  const result = await callGeminiApi('getDictionaryEntry', { word, language });
  return result.text;
};

export const sendTutorMessage = async (history: ChatMessage[], message: string): Promise<string> => {
  const result = await callGeminiApi('sendTutorMessage', { history, message });
  return result.text;
};

// Fix: Add generateQuestions function for QuestionGenerator
export const generateQuestions = async (prompt: string): Promise<string> => {
    const result = await callGeminiApi('generateQuestions', { prompt });
    return result.text;
};

// Fix: Add generateClozeTest function for QuestionGenerator
export const generateClozeTest = async (prompt: string): Promise<string> => {
    const result = await callGeminiApi('generateClozeTest', { prompt });
    return result.text;
};

// Fix: Add generateListeningTask function for ListeningPractice
export const generateListeningTask = async (difficulty: string): Promise<string> => {
    const result = await callGeminiApi('generateListeningTask', { difficulty });
    return result.text;
};

export const analyzeReadingPassage = async (passage: string): Promise<string> => {
    const result = await callGeminiApi('analyzeReadingPassage', { passage });
    return result.text;
};

export const getPersonalizedFeedback = async (history: HistoryItem[]): Promise<string> => {
    const result = await callGeminiApi('getPersonalizedFeedback', { history });
    return result.text;
};

export const getWritingTopic = async (): Promise<string> => {
    const result = await callGeminiApi('getWritingTopic', {});
    return result.text;
};

export const analyzeWrittenText = async (topic: string, text: string): Promise<string> => {
    const result = await callGeminiApi('analyzeWrittenText', { topic, text });
    return result.text;
};
