import { GoogleGenAI } from "@google/genai";

// Per coding guidelines, the API key is obtained exclusively from `process.env.API_KEY`
// and is assumed to be pre-configured, valid, and accessible.
// FIX: Adhere to coding guidelines by removing fallback for API key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Sends a prompt to the Gemini API and returns the text response.
 * @param prompt The user's prompt.
 * @returns The bot's response text.
 */
export const askSwappy = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Swappy, a friendly and helpful assistant mouse for the Eduswap platform, a place for college students to share and borrow educational resources. Keep your answers concise, helpful, and cheerful."
      }
    });
    
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Provide a user-friendly error message
    return "Oops! I'm having a little trouble thinking right now. Please try again in a moment.";
  }
};