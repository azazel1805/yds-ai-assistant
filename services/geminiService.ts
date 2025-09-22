import { GoogleGenAI, GenerateContentResponse, Chat, Type } from "@google/genai";
import { HistoryItem } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- DOĞRU MODEL ADI ---
const MODEL_NAME = 'gemini-1.5-flash-latest';

const YDS_ANALYSIS_PROMPT = `
Sen YDS, YÖKDİL ve e-YDS sınavlarında uzmanlaşmış, son derece dikkatli bir soru analisti ve eğitmensin. Sana bir YDS sorusu verilecek. Görevin, bu soruyu detaylıca analiz etmek ve cevabını MUTLAKA ve SADECE geçerli bir JSON objesi olarak sunmaktır. Cevabının başına veya sonuna asla metin veya markdown (\`\`\`json) ekleme. Sadece saf JSON döndür.

ANALİZ İÇİN KRİTİK NOTLAR:

Zaman Zarflarına Dikkat Et: Cümledeki 'until now', 'so far', 'ago' gibi zaman ifadelerini tespit et ve analizinde kullan. 'until now' genellikle Present Perfect Tense (have/has V3) gerektirir.
Bağlaçlara Odaklan: Zıtlık (but, although), sebep-sonuç (because, due to) gibi bağlaçların anlasal ilişkisini vurgula.

JSON Yapısı:
Soru tipini analiz ederek aşağıdaki JSON yapılarından uygun olanı doldur.

1. Genel Soru Tipi (Kelime, Gramer, Bağlaç, Cümle Tamamlama, vb.):
{
  "soruTipi": "Tespit edilen soru tipi (Örn: Gramer - Tense)",
  "analiz": {
    "ipucu_1": "Soruyu çözmek için ilk ipucu.",
    "ipucu_2": "İkinci önemli ipucu.",
    "kural": "İlgili gramer kuralı veya kelime anlamı.",
    "celdirici_analizi": "Diğer seçeneklerin neden yanlış olduğunun analizi."
  },
  "konu": "Sorunun genel konusu",
  "zorlukSeviyesi": "Kolay/Orta/Zor",
  "dogruCevap": "Doğru seçeneğin harfi (Örn: C)",
  "detayliAciklama": "Doğru cevabın neden doğru olduğuna dair kapsamlı açıklama.",
  "digerSecenekler": [
    { "secenek": "A", "aciklama": "Bu seçeneğin neden yanlış olduğu." },
    { "secenek": "B", "aciklama": "Bu seçeneğin neden yanlış olduğu." }
  ]
}

2. Anlam Bütünlüğünü Bozan Cümle Sorusu:
{
  "soruTipi": "Anlam Bütünlüğünü Bozan Cümle",
  "analiz": {
    "adim_1_ana_tema": "Paragrafın ana temasını veya odak noktasını tek bir cümle ile özetle.",
    "adim_2_cumle_1_iliskisi": "1. cümlenin bu ana temayla ilişkisini açıkla.",
    "adim_3_cumle_2_iliskisi": "2. cümlenin bir önceki cümleyle ve ana temayla ilişkisini açıkla.",
    "adim_4_cumle_3_iliskisi": "3. cümlenin bir önceki cümleyle ve ana temayla ilişkisini açıkla.",
    "adim_5_cumle_4_iliskisi": "4. cümlenin bir önceki cümleyle ve ana temayla ilişkisini açıkla.",
    "adim_6_cumle_5_iliskisi": "5. cümlenin bir önceki cümleyle ve ana temayla ilişkisini açıkla.",
    "adim_7_sonuc": "Yukarıdaki adımlara dayanarak, hangi cümlenin fikir akışını bozduğunu ve nedenini net bir şekilde belirt."
  },
  "konu": "Paragrafın genel konusu",
  "zorlukSeviyesi": "Kolay/Orta/Zor",
  "dogruCevap": "Doğru seçeneğin harfi ve numarası (Örn: D) IV)",
  "detayliAciklama": "'adim_7_sonuc' bölümünde ulaştığın nihai açıklamayı buraya yaz.",
  "digerSecenekler": [
    { "secenek": "A) I", "aciklama": "Bu cümlenin neden akışı bozmadığını kısaca belirt." },
    { "secenek": "B) II", "aciklama": "Bu cümlenin neden akışı bozmadığını kısaca belirt." },
    { "secenek": "C) III", "aciklama": "Bu cümlenin neden akışı bozmadığını kısaca belirt." },
    { "secenek": "E) V", "aciklama": "Bu cümlenin neden akışı bozmadığını kısaca belirt." }
  ]
}
`;


export const analyzeQuestion = async (question: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: question,
      config: {
        systemInstruction: YDS_ANALYSIS_PROMPT,
        responseMimeType: 'application/json',
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing question:", error);
    throw new Error("Failed to analyze the question. Please check the console for details.");
  }
};

export const getDictionaryEntry = async (word: string, language: string = 'Turkish'): Promise<string> => {
  const prompt = `
    Provide a detailed dictionary entry for the word or phrase: "${word}"

    You MUST include ALL of the following sections, clearly labeled EXACTLY as shown with markdown bolding. 
    If you cannot find information for a section (like Antonyms), you MUST write "N/A" for that section instead of omitting it.

    **Pronunciation:** [Provide phonetic spelling or IPA here]
    **Definitions:** [List all common meanings]
    **Synonyms:** [Provide a comma-separated list, or "N/A"]
    **Antonyms:** [Provide a comma-separated list, or "N/A"]
    **Etymology:** [Provide a brief etymology, or "N/A"]
    **Example Sentences:** [List several example sentences]
    **${language} Meaning:** [Provide the meaning in ${language}]
  `;
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching dictionary entry:", error);
    throw new Error("Failed to fetch dictionary entry. Please check the console for details.");
  }
};

export const generateQuestions = async (prompt: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating questions:", error);
    throw new Error("Failed to generate questions. Please check the console for details.");
  }
};


const CLOZE_TEST_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    clozeTests: {
      type: Type.ARRAY,
      description: "An array of cloze test objects, each containing one passage and its 5 questions.",
      items: {
        type: Type.OBJECT,
        properties: {
          passage: {
            type: Type.STRING,
            description: "A text passage with 5 numbered blanks, like (1)___, (2)___, etc."
          },
          questions: {
            type: Type.ARRAY,
            description: "An array of exactly 5 questions, one for each blank in the passage.",
            items: {
              type: Type.OBJECT,
              properties: {
                blankNumber: { type: Type.INTEGER, description: "The number of the blank in the passage." },
                questionType: {
                  type: Type.STRING,
                  description: "The type of question, must be one of: 'Vocabulary', 'Phrasal Verb', 'Preposition', 'Tense', 'Conjunction'."
                },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "An array of 5 plausible options for the blank."
                },
                correctAnswer: {
                  type: Type.STRING,
                  description: "The correct answer string from the options array."
                }
              },
              required: ["blankNumber", "questionType", "options", "correctAnswer"]
            }
          }
        },
        required: ["passage", "questions"]
      }
    }
  },
  required: ["clozeTests"]
};

export const generateClozeTest = async (prompt: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: CLOZE_TEST_SCHEMA,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error generating cloze test:", error);
    throw new Error("Failed to generate cloze test questions. Please check the console.");
  }
};


const AI_TUTOR_PROMPT = `
Sen, Türk öğrencilere YDS ve YÖKDİL gibi İngilizce yeterlilik sınavlarına hazırlanmalarında yardımcı olan uzman, sabırlı ve teşvik edici bir yapay zeka eğitmensin. Adın Onur. Kullanıcıya kendini Onur olarak tanıt ve bir öğretmen gibi davran, arkadaş canlısı ve destekleyici bir ton kullan.
- Cevapların her zaman açık, anlaşılır ve eğitici olmalı.
- Karmaşık gramer kurallarını basit örneklerle açıkla.
- Kelime öğrenimi için ipuçları ver.
- Kullanıcının sorduğu sorulara doğrudan ve net yanıtlar ver.
`;

export const createTutorChatSession = (): Chat => {
  const chat: Chat = ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: AI_TUTOR_PROMPT,
    },
  });
  return chat;
};

export const analyzeReadingPassage = async (passage: string): Promise<string> => {
  const prompt = `Analyze the following English text. The user is a Turkish speaker preparing for the YDS exam.
Text:
---
${passage}
---
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: `You are an expert English language instructor for Turkish students. Your task is to analyze an English text and provide a structured learning module in JSON format. The JSON output MUST conform to the provided schema. Do not add any text or markdown before or after the JSON object.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A concise summary of the text in Turkish."
            },
            vocabulary: {
              type: Type.ARRAY,
              description: "The 10 most important vocabulary words from the text.",
              items: {
                type: Type.OBJECT,
                properties: {
                  word: {
                    type: Type.STRING,
                    description: "The English word."
                  },
                  meaning: {
                    type: Type.STRING,
                    description: "The Turkish meaning of the word."
                  }
                },
                required: ["word", "meaning"]
              }
            },
            questions: {
              type: Type.ARRAY,
              description: "3-4 multiple-choice comprehension questions based on the text.",
              items: {
                type: Type.OBJECT,
                properties: {
                  question: {
                    type: Type.STRING,
                    description: "The question text."
                  },
                  options: {
                    type: Type.ARRAY,
                    description: "An array of 4-5 options.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        key: {
                          type: Type.STRING,
                          description: "The option letter (e.g., 'A')."
                        },
                        value: {
                          type: Type.STRING,
                          description: "The option text."
                        }
                      },
                       required: ["key", "value"]
                    }
                  },
                  correctAnswer: {
                    type: Type.STRING,
                    description: "The key of the correct answer (e.g., 'C')."
                  }
                },
                required: ["question", "options", "correctAnswer"]
              }
            }
          },
          required: ["summary", "vocabulary", "questions"]
        }
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing reading passage:", error);
    throw new Error("Failed to analyze the reading passage. Please check the console for details.");
  }
};


export const getPersonalizedFeedback = async (history: HistoryItem[]): Promise<string> => {
  const historySummary = history.map(item => ({
    soruTipi: item.analysis.soruTipi,
    zorlukSeviyesi: item.analysis.zorlukSeviyesi,
  }));

  const prompt = `Here is a summary of a student's question analysis history for the Turkish YDS exam. Each object represents one analyzed question:\n${JSON.stringify(historySummary, null, 2)}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: `You are an expert YDS exam coach. Your task is to analyze the provided history of a student's work. Identify their top 1-3 weakest areas based on the question types they have analyzed. Provide a concise, encouraging recommendation for them to improve. Then, list their weak topics in a structured format. The entire output must be a valid JSON object conforming to the schema. Do not add any text before or after the JSON. The 'questionType' in the output MUST EXACTLY MATCH one of the keys from this list: ["Kelime Sorusu", "Dil Bilgisi Sorusu", "Cloze Test Sorusu", "Cümle Tamamlama Sorusu", "Çeviri Sorusu", "Paragraf Sorusu", "Diyalog Tamamlama Sorusu", "Restatement (Yeniden Yazma) Sorusu", "Paragraf Tamamlama Sorusu", "Akışı Bozan Cümle Sorusu"].`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendation: {
              type: Type.STRING,
              description: "A short, personalized study recommendation in Turkish."
            },
            weakTopics: {
              type: Type.ARRAY,
              description: "An array of the user's 1 to 3 weakest topics.",
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: {
                    type: Type.STRING,
                    description: "The name of the weak topic in Turkish (e.g., 'Bağlaç Soruları')."
                  },
                  questionType: {
                    type: Type.STRING,
                    description: "The corresponding question type key."
                  }
                },
                required: ["topic", "questionType"]
              }
            }
          },
          required: ["recommendation", "weakTopics"]
        }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error getting personalized feedback:", error);
    throw new Error("Failed to get personalized feedback. Please check the console.");
  }
};

export const getWritingTopic = async (): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: 'Generate a single, random English essay topic suitable for a YDS exam.',
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error getting writing topic:", error);
        throw new Error("Failed to generate a writing topic.");
    }
};

export const analyzeWrittenText = async (topic: string, text: string): Promise<string> => {
    const prompt = `
        Essay Topic: "${topic}"
        Student's Essay:
        ---
        ${text}
        ---
    `;
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                systemInstruction: `You are an expert English exam evaluator for Turkish students preparing for the YDS. Analyze the student's essay based on the provided topic. Provide constructive feedback in a structured JSON format. The feedback should be clear, encouraging, and helpful for improvement. Do not add any text or markdown before or after the JSON object.`,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        overallFeedback: {
                            type: Type.STRING,
                            description: "General feedback about the essay's strengths and weaknesses in Turkish."
                        },
                        grammar: {
                            type: Type.ARRAY,
                            description: "Specific grammar errors found in the text.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    error: { type: Type.STRING, description: "The incorrect phrase or sentence." },
                                    correction: { type: Type.STRING, description: "The corrected version." },
                                    explanation: { type: Type.STRING, description: "A brief explanation of the grammar rule in Turkish." }
                                },
                                required: ["error", "correction", "explanation"]
                            }
                        },
                        vocabulary: {
                            type: Type.ARRAY,
                            description: "Suggestions for better vocabulary usage.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    original: { type: Type.STRING, description: "The original word or phrase used." },
                                    suggestion: { type: Type.STRING, description: "A more effective word or phrase." },
                                    reason: { type: Type.STRING, description: "The reason for the suggestion in Turkish." }
                                },
                                required: ["original", "suggestion", "reason"]
                            }
                        },
                        structureAndCohesion: {
                            type: Type.STRING,
                            description: "Feedback on the essay's organization, flow, and coherence in Turkish."
                        }
                    },
                    required: ["overallFeedback", "grammar", "vocabulary", "structureAndCohesion"]
                }
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing written text:", error);
        throw new Error("Failed to analyze the essay.");
    }
};

export const generateListeningTask = async (difficulty: string): Promise<string> => {
    const prompt = `Generate a short English audio script and 2-3 multiple-choice comprehension questions based on it. The task should be at a '${difficulty}' difficulty level for a Turkish speaker learning English for the YDS exam. The script should be natural, like a short announcement, monologue, or a simple dialogue snippet.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                systemInstruction: `You are an English exam content creator. Your task is to generate a listening comprehension exercise. The output must be a valid JSON object conforming to the schema. Do not add any text or markdown before or after the JSON object.`,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        script: {
                            type: Type.STRING,
                            description: "The English audio script to be read out."
                        },
                        questions: {
                            type: Type.ARRAY,
                            description: "2-3 multiple-choice questions based on the script.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING, description: "The question text." },
                                    options: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                key: { type: Type.STRING, description: "e.g., 'A'" },
                                                value: { type: Type.STRING, description: "Option text" }
                                            },
                                            required: ["key", "value"]
                                        }
                                    },
                                    correctAnswer: { type: Type.STRING, description: "The key of the correct answer." }
                                },
                                required: ["question", "options", "correctAnswer"]
                            }
                        }
                    },
                    required: ["script", "questions"]
                }
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating listening task:", error);
        throw new Error("Failed to generate the listening task.");
    }
};
