
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { GoogleGenAI, Type } from "@google/genai";


const ALLOWED_QUESTION_TYPES_LIST = [
    "Kelime Sorusu", "Dil Bilgisi Sorusu", "Cloze Test Sorusu",
    "Cümle Tamamlama Sorusu", "Çeviri Sorusu", "Paragraf Sorusu",
    "Diyalog Tamamlama Sorusu", "Restatement (Yeniden Yazma) Sorusu",
    "Paragraf Tamamlama Sorusu", "Anlam Bütünlüğünü Bozan Cümle Sorusu"
];

// These prompts and schemas are moved from the original geminiService.ts
const YDS_ANALYSIS_PROMPT = `
Sen YDS, YÖKDİL ve e-YDS sınavlarında uzmanlaşmış, son derece dikkatli bir soru analisti ve eğitmensin. Sana bir YDS sorusu verilecek. Görevin, bu soruyu detaylıca analiz etmek ve cevabını MUTLAKA ve SADECE geçerli bir JSON objesi olarak sunmaktır. Cevabının başına veya sonuna asla metin veya markdown (\`\`\`json) ekleme. Sadece saf JSON döndür.

ANALİZ İÇİN KRİTİK NOTLAR:

Zaman Zarflarına Dikkat Et: Cümledeki 'until now', 'so far', 'ago' gibi zaman ifadelerini tespit et ve analizinde kullan. 'until now' genellikle Present Perfect Tense (have/has V3) gerektirir.
Bağlaçlara Odaklan: Zıtlık (but, although), sebep-sonuç (because, due to) gibi bağlaçların anlasal ilişkisini vurgula.

JSON Yapısı:
Soru tipini analiz ederek aşağıdaki JSON yapılarından uygun olanı doldur.

1. Genel Soru Tipi (Kelime, Gramer, Bağlaç, Cümle Tamamlama, vb.):
{
  "soruTipi": "Tespit edilen soru tipi. Bu alan için değer MUTLAKA şu listeden biriyle başlamalıdır: ${JSON.stringify(ALLOWED_QUESTION_TYPES_LIST)}. Gerekirse, ana tipten sonra bir tire (-) ile alt tipi belirtebilirsin (Örn: Dil Bilgisi Sorusu - Tense).",
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
3. Paragraf / Cloze Test Analizi:
{
  "soruTipi": "Paragraf Sorusu Analizi" veya "Cloze Test Analizi",
  "anaMetinAnalizi": {
    "anaFikir": "Paragrafın veya metnin ana fikri tek bir cümleyle.",
    "konu": "Metnin genel konusu."
  },
  "soruAnalizleri": [
    {
      "soruNumarasi": "Metindeki soru numarası (örn: 17)",
      "dogruCevap": "Bu sorunun doğru seçeneğinin harfi (örn: C)",
      "detayliAciklama": "Bu sorunun doğru cevabının neden doğru olduğuna dair kapsamlı açıklama.",
      "celdiriciAnalizi": "Bu soru için diğer seçeneklerin neden yanlış olduğunun analizi."
    },
    {
      "soruNumarasi": "Metindeki sonraki soru numarası (örn: 18)",
      "dogruCevap": "Bu sorunun doğru seçeneğinin harfi (örn: A)",
      "detayliAciklama": "Bu sorunun doğru cevabının neden doğru olduğuna dair kapsamlı açıklama.",
      "celdiriciAnalizi": "Bu soru için diğer seçeneklerin neden yanlış olduğunun analizi."
    }
  ]
}
`;

const QUESTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    context: {
      type: Type.STRING,
      description: "Eğer varsa, soruların dayandığı okuma parçası veya metin.",
      nullable: true,
    },
    questions: {
      type: Type.ARRAY,
      description: "Oluşturulan soruların bir dizisi.",
      items: {
        type: Type.OBJECT,
        properties: {
          questionText: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                key: { type: Type.STRING },
                value: { type: Type.STRING }
              },
              required: ["key", "value"]
            }
          },
          correctAnswer: { type: Type.STRING }
        },
        required: ["questionText", "options", "correctAnswer"]
      }
    }
  },
  required: ["questions"]
};

const DECONSTRUCTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    mainIdea: {
      type: Type.STRING,
      description: "The main idea of the entire passage in Turkish."
    },
    authorTone: {
      type: Type.STRING,
      description: "The author's tone (e.g., objective, critical, supportive) in Turkish."
    },
    deconstructedSentences: {
      type: Type.ARRAY,
      description: "An array containing the deconstruction of each sentence in the passage.",
      items: {
        type: Type.OBJECT,
        properties: {
          originalSentence: {
            type: Type.STRING,
            description: "The original sentence from the text."
          },
          simplifiedSentence: {
            type: Type.STRING,
            description: "A simplified, rephrased version of the sentence in English."
          },
          grammarExplanation: {
            type: Type.STRING,
            description: "A brief explanation of the key grammar structure in the sentence, in Turkish."
          },
          vocabulary: {
            type: Type.ARRAY,
            description: "Key vocabulary words from this sentence.",
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING, description: "The English word." },
                meaning: { type: Type.STRING, description: "The Turkish meaning." }
              },
              required: ["word", "meaning"]
            }
          }
        },
        required: ["originalSentence", "simplifiedSentence", "grammarExplanation", "vocabulary"]
      }
    }
  },
  required: ["mainIdea", "authorTone", "deconstructedSentences"]
};

const AI_TUTOR_PROMPT = `
Sen, Türk öğrencilere YDS ve YÖKDİL gibi İngilizce yeterlilik sınavlarına hazırlanmalarında yardımcı olan uzman, sabırlı ve teşvik edici bir yapay zeka eğitmensin. Adın Onur. Kullanıcıya kendini Onur olarak tanıt ve bir öğretmen gibi davran, arkadaş canlısı ve destekleyici bir ton kullan.
- Cevapların her zaman açık, anlaşılır ve eğitici olmalı.
- Karmaşık gramer kurallarını basit örneklerle açıkla.
- Kelime öğrenimi için ipuçları ver.
- Kullanıcının sorduğu sorulara doğrudan ve net yanıtlar ver.
`;

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // Use the environment variable name from the build log.
  const apiKey = process.env.GEMINI_API_KEY; 
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'GEMINI_API_KEY is not set.' }) };
  }
  
  const ai = new GoogleGenAI({ apiKey });

  try {
    const body = JSON.parse(event.body || '{}');
    const { action } = body;

    let response;

    switch (action) {
      case 'analyzeQuestion':
        response = await ai.models.generateContent({
          model: 'gemini-1.5-pro-latest', contents: body.question,
          config: { systemInstruction: YDS_ANALYSIS_PROMPT, responseMimeType: 'application/json' },
        });
        break;

      case 'getDictionaryEntry':
        const dictPrompt = `Provide a detailed dictionary entry for the word or phrase: "${body.word}"\n\nYou MUST include ALL of the following sections, clearly labeled EXACTLY as shown with markdown bolding. If you cannot find information for a section (like Antonyms), you MUST write "N/A" for that section instead of omitting it.\n\n**Pronunciation:** [Provide phonetic spelling or IPA here]\n**Definitions:** [List all common meanings]\n**Synonyms:** [Provide a comma-separated list, or "N/A"]\n**Antonyms:** [Provide a comma-separated list, or "N/A"]\n**Etymology:** [Provide a brief etymology, or "N/A"]\n**Example Sentences:** [List several example sentences]\n**${body.language} Meaning:** [Provide the meaning in ${body.language}]`;
        response = await ai.models.generateContent({ model: 'gemini-1.5-pro-latest', contents: dictPrompt });
        break;

      case 'sendTutorMessage':
        const fullPrompt = body.history.map((m: any) => `${m.role}: ${m.text}`).join('\n') + `\nuser: ${body.message}`;
        response = await ai.models.generateContent({
            model: 'gemini-1.5-pro-latest',
            contents: fullPrompt,
            config: { systemInstruction: AI_TUTOR_PROMPT }
        });
        break;

      case 'getReadingSummaryAndVocab':
        response = await ai.models.generateContent({
          model: 'gemini-1.5-pro-latest',
          contents: `Analyze the following English text. The user is a Turkish speaker preparing for the YDS exam.\nText:\n---\n${body.passage}\n---`,
          config: {
            // GÜNCELLENDİ: Talimat daha net hale getirildi.
            systemInstruction: `You are an expert English language instructor. Analyze the text and provide ONLY a summary and the 10 most important vocabulary words. The output MUST be a valid JSON object. CRITICAL: Each object inside the 'vocabulary' array MUST contain BOTH a 'word' property AND a 'meaning' property. Do not separate them into different objects.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT, properties: {
                summary: { type: Type.STRING, description: "A concise summary of the text in Turkish." },
                vocabulary: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      word: { type: Type.STRING },
                      meaning: { type: Type.STRING }
                    },
                    // GÜNCELLENDİ: Bu, her objenin hem kelime hem anlam içermesini zorunlu kılar.
                    required: ["word", "meaning"]
                  }
                },
              },
              required: ["summary", "vocabulary"]
            }
          },
        });
        break;

      // YENİ CASE: Sadece anlama sorularını üretir (DAHA HIZLI)
      case 'getReadingQuestions':
        response = await ai.models.generateContent({
          model: 'gemini-1.5-pro-latest',
          contents: `Based on the following English text, generate 3-4 multiple-choice comprehension questions suitable for a YDS exam candidate. The user is a Turkish speaker.\nText:\n---\n${body.passage}\n---`,
          config: {
            systemInstruction: `You are an expert English language instructor. Your task is to generate questions based on the provided text. The output MUST be a valid JSON object conforming to the schema.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT, properties: {
                questions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { key: { type: Type.STRING }, value: { type: Type.STRING } } } }, correctAnswer: { type: Type.STRING } } } }
              },
              required: ["questions"]
            }
          },
        });
        break;

      case 'getPersonalizedFeedback':
        response = await ai.models.generateContent({
            model: 'gemini-1.5-pro-latest',
            contents: `Here is a summary of a student's question analysis history for the Turkish YDS exam. Each object represents one analyzed question:\n${JSON.stringify(body.history.map((item: any) => ({ soruTipi: item.analysis.soruTipi, zorlukSeviyesi: item.analysis.zorlukSeviyesi })), null, 2)}`,
            config: {
                systemInstruction: `You are an expert YDS exam coach. Your task is to analyze the provided history of a student's work. Identify their top 1-3 weakest areas based on the question types they have analyzed. Provide a concise, encouraging recommendation for them to improve. Then, list their weak topics in a structured format. The entire output must be a valid JSON object conforming to the schema. Do not add any text before or after the JSON. The 'questionType' in the output MUST EXACTLY MATCH one of the keys from this list: ["Kelime Sorusu", "Dil Bilgisi Sorusu", "Cloze Test Sorusu", "Cümle Tamamlama Sorusu", "Çeviri Sorusu", "Paragraf Sorusu", "Diyalog Tamamlama Sorusu", "Restatement (Yeniden Yazma) Sorusu", "Paragraf Tamamlama Sorusu", "Akışı Bozan Cümle Sorusu"].`,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT, properties: {
                    recommendation: { type: Type.STRING },
                    weakTopics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, questionType: { type: Type.STRING } } } }
                  }
                }
            }
        });
        break;

      case 'getWritingTopic':
        response = await ai.models.generateContent({
            model: 'gemini-1.5-pro-latest',
            contents: 'Generate a single, random English essay topic suitable for a YDS exam.',
        });
        break;

      // Fix: Add generateQuestions handler
      case 'generateQuestions':
        response = await ai.models.generateContent({
            model: 'gemini-1.5-pro-latest',
            contents: body.prompt,
        });
        break;

            
            case 'generateSimilarQuiz': {
        const { originalQuestion, analysis } = body;
        
        // --- DÜZELTME BAŞLANGICI ---
        // Analizden elde edilen yapılandırılmış verileri (konu, kural, zorluk)
        // kullanarak yapay zekaya çok daha net ve hedefe yönelik bir talimat veriyoruz.
        // Bu, daha tutarlı ve doğru sonuçlar üretmesini sağlar.
        const prompt = `
          Bir YDS soru hazırlama uzmanısın. Görevin, verilen bilgilere dayanarak 5 adet tamamen YENİ ve ÖZGÜN çoktan seçmeli soru oluşturmaktır.

          **KONU:** ${analysis.konu}
          **SORU TİPİ / KURAL:** ${analysis.soruTipi} - ${analysis.analiz.kural || 'Genel'}
          **ZORLUK SEVİYESİ:** ${analysis.zorlukSeviyesi}

          Lütfen bu kriterlere uygun 5 tane soru oluştur.

          **KESİNLİKLE KULLANMA:** Aşağıdaki örnek soruyu veya seçeneklerini yanıtta tekrarlama. Bu sadece bir referanstır ve yeni sorularda kullanılmamalıdır.
          ---
          ${originalQuestion}
          ---
        `;
        // --- DÜZELTME SONU ---
        
        response = await ai.models.generateContent({
            model: 'gemini-1.5-pro-latest',
            contents: prompt,
            config: {
                systemInstruction: "Cevabın, sağlanan JSON şemasına tam olarak uyan geçerli bir JSON objesi olmalıdır. 'questions' dizisinin içinde 5 soru olduğundan emin ol.",
                responseMimeType: 'application/json',
                responseSchema: QUESTION_SCHEMA
            }
        });
        break; 

       }

      case 'deconstructPassage': {
        const prompt = `Deconstruct the following English passage for a Turkish student preparing for the YDS exam.\n---\n${body.passage}\n---`;
        response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                systemInstruction: `You are an expert English language instructor for Turkish students. Your task is to deconstruct an English passage sentence by sentence...`,
                responseMimeType: 'application/json',
                responseSchema: DECONSTRUCTION_SCHEMA,
            }
        });
        break;
      }
      
      
      }
      case 'analyzeWrittenText':
        response = await ai.models.generateContent({
            model: 'gemini-1.5-pro-latest',
            contents: `Essay Topic: "${body.topic}"\nStudent's Essay:\n---\n${body.text}\n---`,
            config: {
                systemInstruction: `You are an expert English exam evaluator for Turkish students preparing for the YDS. Analyze the student's essay based on the provided topic. Provide constructive feedback in a structured JSON format. The feedback should be clear, encouraging, and helpful for improvement. Do not add any text or markdown before or after the JSON object.`,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT, properties: {
                        overallFeedback: { type: Type.STRING },
                        grammar: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { error: { type: Type.STRING }, correction: { type: Type.STRING }, explanation: { type: Type.STRING } } } },
                        vocabulary: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { original: { type: Type.STRING }, suggestion: { type: Type.STRING }, reason: { type: Type.STRING } } } },
                        structureAndCohesion: { type: Type.STRING }
                    }
                }
            }
        });
        break;
      
      default:
        return { statusCode: 400, body: JSON.stringify({ error: `Unknown action: ${action}` }) };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: response.text }),
    };

  } 


export const deconstructPassage = async (passage: string): Promise<string> => {
    const prompt = `Deconstruct the following English passage for a Turkish student preparing for the YDS exam.
---
${passage}
---
`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-pro-latest',
            contents: prompt,
            config: {
                systemInstruction: `You are an expert English language instructor for Turkish students. Your task is to deconstruct an English passage sentence by sentence. You MUST identify every sentence in the original passage and provide a corresponding analysis for it in the 'deconstructedSentences' array. Ensure all explanations are clear and helpful. The entire output must be a valid JSON object conforming to the provided schema. Do not add any text before or after the JSON.`,
                responseMimeType: 'application/json',
                responseSchema: DECONSTRUCTION_SCHEMA,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error deconstructing passage:", error);
        throw new Error("Failed to deconstruct the passage. Please check the console for details.");
    }
};

      
  catch (error: any) {
    console.error("Error in Gemini function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "An internal server error occurred." }),
    };
  }
};

export { handler };
