import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    topic: {
      type: Type.STRING,
      description: "Chủ đề chính của video.",
    },
    keyPoints: {
      type: Type.ARRAY,
      description: "Danh sách các điểm chính hoặc nội dung cốt lõi từ video.",
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ['topic', 'keyPoints'],
};

export const analyzeTranscript = async (transcript: string): Promise<AnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Phân tích bản ghi video YouTube sau đây và cung cấp chủ đề chính cùng danh sách các điểm cốt lõi.

      **Bản ghi:**
      ---
      ${transcript}
      ---
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2,
      },
    });

    const jsonText = response.text.trim();
    const parsedResult = JSON.parse(jsonText);
    
    if (!parsedResult.topic || !Array.isArray(parsedResult.keyPoints)) {
        throw new Error("Invalid response format from API");
    }

    return parsedResult as AnalysisResult;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to analyze transcript. Please check the API response and your configuration.");
  }
};

export const translateResult = async (result: AnalysisResult, targetLanguage: string): Promise<AnalysisResult> => {
  const prompt = `Translate the following topic and key points into ${targetLanguage}. Maintain the original meaning and structure.

  **Topic to translate:**
  ${result.topic}

  **Key Points to translate:**
  ${result.keyPoints.map(p => `- ${p}`).join('\n')}

  Respond ONLY with the JSON object.
  `;

  try {
      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
              responseMimeType: "application/json",
              responseSchema: responseSchema,
              temperature: 0.1,
          },
      });

      const jsonText = response.text.trim();
      const parsedResult = JSON.parse(jsonText);
      
      if (!parsedResult.topic || !Array.isArray(parsedResult.keyPoints)) {
          throw new Error("Invalid response format from translation API");
      }

      return parsedResult as AnalysisResult;
  } catch (error) {
      console.error("Error calling Gemini API for translation:", error);
      throw new Error(`Failed to translate result to ${targetLanguage}.`);
  }
};

export const generateScript = async (
    translatedResult: AnalysisResult, 
    duration: number, // in minutes
    language: string
): Promise<string> => {
    // Average speaking rate is ~140 words per minute
    const wordCount = duration * 140;

    const prompt = `
    You are an inspirational storyteller. Your task is to write a completely new, motivational story in the language: **${language}**.
    The story should be told from the perspective of a single narrator, perfect for a text-to-speech application.

    Base the story on the following topic and key points.
    - **Topic:** ${translatedResult.topic}
    - **Key Points:** ${translatedResult.keyPoints.map(p => `\n  - ${p}`).join('')}

    **CRITICAL INSTRUCTIONS:**
    1.  **Opening Hook:** You MUST start the story with a powerful, captivating hook (câu hook) to immediately grab the listener's attention. This is a mandatory first step.
    2.  **Structure:** After the hook, the story MUST have a clear introduction (mở bài), body (thân bài), and conclusion (kết bài).
    3.  **Format:** Write it as a continuous narrative text. DO NOT use script format with character names and dialogues. It should be a single block of prose.
    4.  **Change Character Names:** If any character names are mentioned in the topic or key points, you MUST change them to new, different names that are appropriate for the **${language}** language and culture.
    5.  **Story Length:** The story should be approximately **${wordCount}** words long. This is suitable for a reading time of **${duration}** minutes at a normal speaking pace.
    
    Respond ONLY with the story text.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro", // Using a more powerful model for creative writing
            contents: prompt,
            config: {
                temperature: 0.75,
            },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error calling Gemini API for script generation:", error);
        throw new Error('Failed to generate the story.');
    }
};

export const translateStory = async (story: string, targetLanguage: string): Promise<string> => {
    const prompt = `Translate the following story into ${targetLanguage}.
    Maintain the tone, style, and narrative flow of the original text.
    
    **CRITICAL INSTRUCTION:** If the original story contains any character names, you MUST change them to new names that are culturally and linguistically appropriate for the **${targetLanguage}** language. For example, if translating a Vietnamese story to English, a name like "An" or "Minh" should be changed to a common English name like "Anna" or "Michael".

    Respond ONLY with the translated story text.

    **Story to Translate:**
    ---
    ${story}
    ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.2,
            },
        });
        return response.text.trim();
    } catch (error) {
        console.error(`Error translating story to ${targetLanguage}:`, error);
        throw new Error(`Failed to translate the story to ${targetLanguage}.`);
    }
};
