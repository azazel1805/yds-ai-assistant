// src/services/geminiService.ts

import { ChatMessage, HistoryItem, AnalysisResult, ParsedQuestion, NewsResult } from '../types';

// --- YENİ EKLENEN FONKSİYON ---
/**
 * Yapay zekadan gelen ve bazen bozuk olabilen JSON metnini güvenli bir şekilde ayrıştırır.
 * Metnin başındaki/sonundaki markdown kod bloklarını (```json ... ```) temizler.
 * @param jsonString Ayrıştırılacak metin.
 * @returns Ayrıştırılmış JavaScript objesi veya hata durumunda boş bir obje {}.
 */
const parseJsonGracefully = (jsonString: string): any => {
  if (typeof jsonString !== 'string') {
    console.error("parseJsonGracefully received a non-string input:", jsonString);
    return {};
  }
  
  // Metnin başındaki ve sonundaki olası markdown kod bloklarını ve boşlukları temizle
  let cleanString = jsonString.trim();
  if (cleanString.startsWith('```json')) {
    cleanString = cleanString.substring(7).trim();
  }
  if (cleanString.endsWith('```')) {
    cleanString = cleanString.slice(0, -3).trim();
  }

  try {
    // Temizlenmiş metni JSON olarak ayrıştırmayı dene
    return JSON.parse(cleanString);
  } catch (error) {
    console.error("JSON parse hatası:", error);
    console.error("Ayrıştırılamayan metin:", jsonString);
    // Hata durumunda boş bir obje döndürerek uygulamanın çökmesini engelle
    return {}; 
  }
};


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

export const generateSimilarQuiz = async (originalQuestion: string, analysis: AnalysisResult): Promise<{ questions: ParsedQuestion[] }> => {
  const result = await callGeminiApi('generateSimilarQuiz', { originalQuestion, analysis });
  
  // --- DÜZELTME BURADA ---
  // Artık tanımlı olan parseJsonGracefully fonksiyonunu kullanıyoruz.
  const parsedResult = parseJsonGracefully(result.text);

  // parsedResult boş bir obje olsa bile bu kontrol güvenli bir şekilde çalışır.
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
    // parseJsonGracefully'yi burada da kullanmak daha güvenli olur.
    const parsed = parseJsonGracefully(result.text);
    if (!parsed.summary || !parsed.vocabulary) {
        throw new Error("Invalid JSON response for summary/vocab.");
    }
    return parsed;
};

export const getReadingQuestions = async (passage: string): Promise<any> => {
    const result = await callGeminiApi('getReadingQuestions', { passage });
    // parseJsonGracefully'yi burada da kullanmak daha güvenli olur.
    const parsed = parseJsonGracefully(result.text);
    if (!parsed.questions) {
        throw new Error("Invalid JSON response for questions.");
    }
    return parsed;
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



export const deconstructPassage = async (passage: string): Promise<any> => {
  const result = await callGeminiApi('deconstructPassage', { passage });
  return parseJsonGracefully(result.text);
  };

export const getNewsSummary = async (topic: string): Promise<NewsResult> => {
  const result = await callGeminiApi('getNewsSummary', { topic });
  // Backend'den gelen çift stringify edilmiş JSON'u parse ediyoruz.
  return parseJsonGracefully(result.text); 
};

// YENİ: Haber metnine göre soru üretmek için servis fonksiyonu
export const generateNewsQuestions = async (paragraph: string): Promise<any> => {
  const result = await callGeminiApi('generateNewsQuestions', { paragraph });
  return parseJsonGracefully(result.text);
};
