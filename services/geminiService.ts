
import { ChatMessage, HistoryItem } from '../types';
import { AnalysisResult } from '../types'; // Bu importu dosyanın başına eklemeniz gerekebilir.

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
    if (error instanceof Error) {import { ChatMessage, HistoryItem, AnalysisResult } from '../types';

/**
 * AI'dan gelen potansiyel olarak bozuk JSON metnini güvenli bir şekilde temizler ve ayrıştırır.
 */
function parseJsonGracefully(text: string): any {
  try {
    const trimmedText = text.trim();
    const startIndex = trimmedText.indexOf('{');
    const endIndex = trimmedText.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
      throw new Error("Yanıt içinde geçerli bir JSON objesi bulunamadı.");
    }
    const jsonString = trimmedText.substring(startIndex, endIndex + 1);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Güvenli JSON ayrıştırma başarısız oldu. Orijinal metin:", text);
    if (error instanceof Error) {
        throw new Error(`AI yanıtı ayrıştırılamadı: ${error.message}`);
    }
    throw new Error("JSON ayrıştırma sırasında bilinmeyen bir hata oluştu.");
  }
}

/**
 * Backend API'sine merkezi bir çağrı yapmak için kullanılan yardımcı fonksiyon.
 */
const callGeminiApi = async (action: string, payload: object): Promise<any> => {
  try {
    const response = await fetch('/.netlify/functions/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'Sunucudan gelen hata mesajı okunamadı' }));
      throw new Error(errorBody.error || `Gemini API eylemi çağrılamadı: ${action}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`callGeminiApi içinde hata oluştu (eylem: ${action}):`, error);
    if (error instanceof Error) {
        throw new Error(`Bir sunucu hatası oluştu: ${error.message}`);
    }
    throw new Error('Bilinmeyen bir sunucu hatası oluştu.');
  }
};

// --- JSON DÖNMESİ BEKLENEN FONKSİYONLAR ---

export const analyzeQuestion = async (question: string): Promise<any> => {
  const result = await callGeminiApi('analyzeQuestion', { question });
  return parseJsonGracefully(result.text);
};

export const generateQuestions = async (prompt: string, useJsonMode: boolean = false): Promise<any> => {
  const result = await callGeminiApi('generateQuestions', { prompt, useJsonMode });
  if (useJsonMode) {
    return parseJsonGracefully(result.text);
  }
  return result.text;
};

export const generateClozeTest = async (prompt: string): Promise<any> => {
  const result = await callGeminiApi('generateClozeTest', { prompt });
  return parseJsonGracefully(result.text);
};

export const generateListeningTask = async (difficulty: string): Promise<any> => {
  const result = await callGeminiApi('generateListeningTask', { difficulty });
  return parseJsonGracefully(result.text);
};

export const getReadingSummaryAndVocab = async (passage: string): Promise<any> => {
  const result = await callGeminiApi('getReadingSummaryAndVocab', { passage });
  return parseJsonGracefully(result.text);
};

export const getReadingQuestions = async (passage: string): Promise<any> => {
  const result = await callGeminiApi('getReadingQuestions', { passage });
  return parseJsonGracefully(result.text);
};

export const getPersonalizedFeedback = async (history: HistoryItem[]): Promise<any> => {
  const result = await callGeminiApi('getPersonalizedFeedback', { history });
  return parseJsonGracefully(result.text);
};

export const analyzeWrittenText = async (topic: string, text: string): Promise<any> => {
  const result = await callGeminiApi('analyzeWrittenText', { topic, text });
  return parseJsonGracefully(result.text);
};

export const generateSimilarQuiz = async (originalQuestion: string, analysis: AnalysisResult): Promise<any> => {
  const result = await callGeminiApi('generateSimilarQuiz', { originalQuestion, analysis });
  const parsedResult = parseJsonGracefully(result.text);
  if (!parsedResult.questions || parsedResult.questions.length === 0) {
    throw new Error("Yapay zeka bu konu için yeni sorular üretemedi. Lütfen daha genel bir konuya sahip farklı bir soru deneyin.");
  }
  return parsedResult;
};

// --- DÜZ METİN DÖNMESİ BEKLENEN FONKSİYONLAR ---

export const getDictionaryEntry = async (word: string, language: string = 'Turkish'): Promise<string> => {
  const result = await callGeminiApi('getDictionaryEntry', { word, language });
  return result.text;
};

export const sendTutorMessage = async (history: ChatMessage[], message: string): Promise<string> => {
  const result = await callGeminiApi('sendTutorMessage', { history, message });
  return result.text;
};

export const getWritingTopic = async (): Promise<string> => {
  const result = await callGeminiApi('getWritingTopic', {});
  return result.text;
};
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

export const generateSimilarQuiz = async (originalQuestion: string, analysis: AnalysisResult): Promise<any> => {
  const result = await callGeminiApi('generateSimilarQuiz', { originalQuestion, analysis });
  const parsedResult = parse(result.text);
  if (!parsedResult.questions || parsedResult.questions.length === 0) {
    throw new Error("Yapay zeka bu konu için yeni sorular üretemedi. Lütfen daha genel bir konuya sahip farklı bir soru deneyin.");
  }
  return parsedResult;
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

export const getReadingSummaryAndVocab = async (passage: string): Promise<any> => {
    const result = await callGeminiApi('getReadingSummaryAndVocab', { passage });
    try {
      return JSON.parse(result.text);
    } catch (e) {
      console.error("Failed to parse JSON from getReadingSummaryAndVocab:", result.text);
      throw new Error("Invalid JSON response for summary/vocab.");
    }
};

export const getReadingQuestions = async (passage: string): Promise<any> => {
    const result = await callGeminiApi('getReadingQuestions', { passage });
    try {
      return JSON.parse(result.text);
    } catch (e) {
      console.error("Failed to parse JSON from getReadingQuestions:", result.text);
      throw new Error("Invalid JSON response for questions.");
    }
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
