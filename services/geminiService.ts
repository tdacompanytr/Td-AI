import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

const apiKey = process.env.API_KEY;

// Safe initialization
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Hataları analiz eder ve kullanıcı dostu Türkçe mesajlar döndürür.
 */
const handleGeminiError = (error: any): string => {
  console.error("Gemini API Error Detail:", error);
  
  const msg = error?.message || error?.toString() || "";

  // 1. Ağ ve Bağlantı Hataları
  if (msg.includes("fetch failed") || msg.includes("NetworkError") || msg.includes("Failed to fetch")) {
    return "⚠️ İnternet bağlantısında bir sorun var veya sunucuya ulaşılamıyor. Lütfen bağlantınızı kontrol edip tekrar deneyin.";
  }

  // 2. Yetkilendirme ve API Anahtarı Hataları
  if (msg.includes("API key") || msg.includes("401") || msg.includes("403")) {
    return "🔒 API Anahtarı (API Key) geçersiz veya süresi dolmuş. Lütfen yapılandırmanızı kontrol edin.";
  }

  // 3. Kota ve Limit Hataları
  if (msg.includes("429") || msg.includes("quota") || msg.includes("Resource has been exhausted")) {
    return "⏳ Çok fazla istek gönderildi (Kota Aşımı). Lütfen bir süre bekleyip tekrar deneyin.";
  }

  // 4. Güvenlik ve İçerik Politikaları
  if (msg.includes("SAFETY") || msg.includes("blocked") || msg.includes("harmful")) {
    return "🛡️ Bu istek, güvenlik politikalarımız gereği işlenemedi. Daha farklı bir ifadeyle tekrar deneyin.";
  }

  // 5. Model Bulunamadı Hatası
  if (msg.includes("404") || msg.includes("not found")) {
    return "🚫 İstenen model şu anda kullanılamıyor veya bulunamadı. Lütfen daha sonra tekrar deneyin.";
  }

  // 6. Aşırı Yüklenme (Overloaded)
  if (msg.includes("503") || msg.includes("overloaded")) {
    return "🔥 Sunucular şu an çok yoğun. Lütfen kısa bir süre sonra tekrar deneyin.";
  }

  // Genel Hata
  return `❌ Beklenmedik bir hata oluştu: ${msg.substring(0, 100)}...`;
};

export const sendMessageToGemini = async (
  message: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  mediaData?: string, // Base64 encoded string for image or video
  systemInstruction?: string,
  config: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    safetyLevel?: 'low' | 'medium' | 'high' | 'none';
  } = {}
): Promise<string> => {
  if (!ai) {
    throw new Error("API Key not configured");
  }

  try {
    const modelName = 'gemini-2.5-flash';
    const defaultPersona = `Sen Td AI'sın. Yardımcı, zeki ve samimi bir yapay zeka asistanısın.`;

    // Safety Settings Mapping
    let safetySettings = [];
    if (config.safetyLevel === 'none') {
        safetySettings = [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ];
    } else if (config.safetyLevel === 'high') {
         safetySettings = [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
        ];
    }

    const chat = ai.chats.create({
      model: modelName,
      history: history,
      config: {
        systemInstruction: systemInstruction || defaultPersona,
        temperature: config.temperature ?? 0.7,
        maxOutputTokens: config.maxOutputTokens,
        topP: config.topP,
        frequencyPenalty: config.frequencyPenalty,
        presencePenalty: config.presencePenalty,
        safetySettings: safetySettings,
      },
    });

    let result;

    if (mediaData) {
      // Default mime type, though we try to extract it
      let mimeType = 'image/jpeg'; 
      let data = mediaData;

      // Try to extract mime type from base64 header
      const match = mediaData.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        data = match[2];
      } else {
        // Fallback logic if regex fails but comma exists
        const split = mediaData.split(',');
        if (split.length > 1) {
            data = split[1];
            if (split[0].includes('png')) mimeType = 'image/png';
            if (split[0].includes('webp')) mimeType = 'image/webp';
            if (split[0].includes('mp4')) mimeType = 'video/mp4';
            if (split[0].includes('webm')) mimeType = 'video/webm';
        }
      }

      const parts: any[] = [
        {
          inlineData: {
            mimeType: mimeType,
            data: data
          }
        },
        { text: message }
      ];

      // Pass parts directly as message for multimodal
      result = await chat.sendMessage({ 
        message: parts 
      });
    } else {
      result = await chat.sendMessage({ message });
    }

    return result.text || "Yanıt oluşturulamadı.";
  } catch (error) {
    const userFriendlyError = handleGeminiError(error);
    throw new Error(userFriendlyError);
  }
};

export const generateImageWithGemini = async (prompt: string): Promise<string> => {
  if (!ai) {
    throw new Error("API Key not configured");
  }

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
        outputMimeType: 'image/jpeg'
      }
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    
    if (!imageBytes) {
      throw new Error("Görsel oluşturulamadı, sunucudan veri gelmedi.");
    }

    return `data:image/jpeg;base64,${imageBytes}`;
  } catch (error) {
    const userFriendlyError = handleGeminiError(error);
    throw new Error(userFriendlyError);
  }
};

/**
 * Kullanıcının ilk mesajına göre kısa bir başlık (2-4 kelime) oluşturur.
 */
export const generateChatTitle = async (firstMessage: string): Promise<string> => {
  if (!ai) return "Yeni Sohbet";

  try {
    // Optimize edilmiş prompt: Kısa, öz ve emoji içeren başlıklar ister
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Aşağıdaki mesajı analiz et ve bu sohbet için çok kısa (2-4 kelime), içeriği özetleyen Türkçe bir başlık yaz. Mümkünse başa uygun bir emoji ekle. Sadece başlığı döndür, tırnak işareti kullanma.\n\nMesaj: ${firstMessage.substring(0, 300)}`,
    });
    
    return response.text?.trim() || "Yeni Sohbet";
  } catch (e) {
    console.warn("Başlık oluşturulamadı:", e);
    return "Yeni Sohbet";
  }
};

export const sendFeedback = async (messageId: string, rating: 'like' | 'dislike', feedbackText?: string) => {
  console.log(`[Gemini Feedback] Message ID: ${messageId}, Rating: ${rating}, Context: ${feedbackText}`);
  return Promise.resolve();
};