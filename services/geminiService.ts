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
    
    // The serverless function returns a JSON object like { "text": "..." }
    // We return this entire object to the calling function.
    return await response.json();
  } catch (error) {
    console.error(`Error in callGeminiApi for action ${action}:`, error);
    if (error instanceof Error) {
        throw new Error(`A server error occurred: ${error.message}`);
    }
    throw new Error('An unknown server error occurred.');
  }
};

// --- SERVIS FONKSİYONLARI ---

// JSON dönmesi beklenen fonksiyonlar artık metni kendileri parse ediyor.
export const analyzeQuestion = async (question: string): Promise<any> => {
  const result = await callGeminiApi('analyzeQuestion', { question });
  try {
    return JSON.parse(result.text);
  } catch (e) {
    console.error("Failed to parse JSON from analyzeQuestion:", result.text);
    throw new Error("Invalid JSON response received for question analysis.");
  }
};

// Düz metin dönen fonksiyonlar değişmeden kalıyor.
export const getDictionaryEntry = async (word: string, language: string = 'Turkish'): Promise<string> => {
  const result = await callGeminiApi('getDictionaryEntry', { word, language });
  return result.text;
};

// GÜNCELLENDİ: Bu fonksiyon artık JSON modu için ikinci bir parametre alıyor.
export const generateQuestions = async (prompt: string, useJsonMode: boolean = false): Promise<any> => {
  // useJsonMode bayrağı backend'e gönderiliyor.
  const result = await callGeminiApi('generateQuestions', { prompt, useJsonMode });
  const responseText = result.text;

  // Eğer JSON modu istenmişse, metni burada objeye çevirip gönderiyoruz.
  if (useJsonMode) {
    try {
      return JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse JSON from generateQuestions:", responseText);
      throw new Error("Invalid JSON response received from question generator.");
    }
  }
  // JSON modu istenmemişse, düz metin olarak gönderiyoruz.
  return responseText;
};

export const generateClozeTest = async (prompt: string): Promise<any> => {
  const result = await callGeminiApi('generateClozeTest', { prompt });
  try {
    return JSON.parse(result.text);
  } catch (e) {
    console.error("Failed to parse JSON from generateClozeTest:", result.text);
    throw new Error("Invalid JSON response received for cloze test.");
  }
};

export const sendTutorMessage = async (history: ChatMessage[], message: string): Promise<string> => {
  const result = await callGeminiApi('sendTutorMessage', { history, message });
  return result.text;
};

export const analyzeReadingPassage = async (passage: string): Promise<any> => {
    const result = await callGeminiApi('analyzeReadingPassage', { passage });
    try {
      return JSON.parse(result.text);
    } catch (e) {
      console.error("Failed to parse JSON from analyzeReadingPassage:", result.text);
      throw new Error("Invalid JSON response received for reading passage analysis.");
    }
};

export const getPersonalizedFeedback = async (history: HistoryItem[]): Promise<any> => {
    const result = await callGeminiApi('getPersonalizedFeedback', { history });
    try {
      return JSON.parse(result.text);
    } catch (e) {
      console.error("Failed to parse JSON from getPersonalizedFeedback:", result.text);
      throw new Error("Invalid JSON response received for personalized feedback.");
    }
};

export const generateListeningTask = async (difficulty: string): Promise<any> => {
    const result = await callGeminiApi('generateListeningTask', { difficulty });
    try {
      return JSON.parse(result.text);
    } catch (e) {
      console.error("Failed to parse JSON from generateListeningTask:", result.text);
      throw new Error("Invalid JSON response received for listening task.");
    }
};

export const getWritingTopic = async (): Promise<string> => {
    const result = await callGeminiApi('getWritingTopic', {});
    return result.text;
};

export const analyzeWrittenText = async (topic: string, text: string): Promise<any> => {
    const result = await callGeminiApi('analyzeWrittenText', { topic, text });
    try {
      return JSON.parse(result.text);
    } catch (e) {
      console.error("Failed to parse JSON from analyzeWrittenText:", result.text);
      throw new Error("Invalid JSON response received for written text analysis.");
    }
};
