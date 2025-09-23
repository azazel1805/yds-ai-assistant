import { ChatMessage, HistoryItem, AnalysisResult } from '../types';

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

// --- SERVIS FONKSİYONLARI ---

// JSON dönmesi beklenen tüm fonksiyonlar 'parseJsonGracefully' kullanıyor.
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

// DÜZELTME: Bu fonksiyon artık doğru yerde, callGeminiApi'ye erişebiliyor.
export const generateSimilarQuiz = async (originalQuestion: string, analysis: AnalysisResult): Promise<any> => {
  const result = await callGeminiApi('generateSimilarQuiz', { originalQuestion, analysis });
  const parsedResult = parseJsonGracefully(result.text);

  // Eğer AI geçerli bir JSON ama boş bir questions dizisi döndürürse,
  // bunu yakalayıp kullanıcıya özel bir hata fırlat.
  if (!parsedResult.questions || parsedResult.questions.length === 0) {
    throw new Error("Yapay zeka bu konu için yeni sorular üretemedi. Lütfen daha genel bir konuya sahip farklı bir soru deneyin.");
  }
  
  return parsedResult;
};

// Düz metin döndüren fonksiyonlar (değişiklik yok)
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
