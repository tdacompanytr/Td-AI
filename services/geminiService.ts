
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;

// Safe initialization: The app handles the missing key in the UI, 
// but we define the client here.
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const sendMessageToGemini = async (
  message: string,
  history: { role: 'user' | 'model'; parts: [{ text: string }] }[],
  image?: string,
  systemInstruction?: string
): Promise<string> => {
  if (!ai) {
    throw new Error("API Key not configured");
  }

  try {
    // Model configuration
    // gemini-2.5-flash is multimodal and good for vision
    const modelName = 'gemini-2.5-flash';

    // Default persona if none provided
    const defaultPersona = `Sen Td AI'sın. Yardımcı, zeki ve samimi bir yapay zeka asistanısın.`;

    const chat = ai.chats.create({
      model: modelName,
      history: history,
      config: {
        systemInstruction: systemInstruction || defaultPersona,
      },
    });

    let result;

    if (image) {
      // Parse the image string to get mimeType and base64 data
      // Expected format: data:image/jpeg;base64,/9j/4AAQSk...
      let mimeType = 'image/jpeg';
      let data = image;

      const match = image.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        data = match[2];
      } else {
        // Fallback: assume it might be raw base64 or just split by comma
        const split = image.split(',');
        if (split.length > 1) {
            data = split[1];
            // Try to infer mime from the header part if needed, or stick to default
            if (split[0].includes('png')) mimeType = 'image/png';
            if (split[0].includes('webp')) mimeType = 'image/webp';
        }
      }

      // Construct parts: Image first, then text is a common convention for "Caption this" style tasks
      const parts: any[] = [
        {
          inlineData: {
            mimeType: mimeType,
            data: data
          }
        },
        { text: message }
      ];

      // For multimodal input in chat, we use sendMessage with parts
      result = await chat.sendMessage({ 
        message: parts 
      });
    } else {
      // Text only message
      result = await chat.sendMessage({ message });
    }

    return result.text || "No response generated.";
  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    throw error;
  }
};

export const generateImageWithGemini = async (prompt: string): Promise<string> => {
  if (!ai) {
    throw new Error("API Key not configured");
  }

  try {
    // Updated to use the latest available Imagen model to avoid 404 errors
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
        outputMimeType: 'image/jpeg'
      }
    });

    // The SDK returns generatedImages array. We take the first one.
    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    
    if (!imageBytes) {
      throw new Error("No image generated");
    }

    // Return as base64 string ready for src
    return `data:image/jpeg;base64,${imageBytes}`;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

export const sendFeedback = async (messageId: string, rating: 'like' | 'dislike', feedbackText?: string) => {
  // In a real-world application, this would send data to your backend or the model tuning endpoint.
  console.log(`[Gemini Feedback] Message ID: ${messageId}, Rating: ${rating}, Context: ${feedbackText}`);
  return Promise.resolve();
};
