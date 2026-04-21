import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function askGemini(prompt: string) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are "AquaLog Coach", a hydration specialist. 
    Your goal is to encourage the user to drink water.
    
    If the user finished their goal (8 glasses), congratulate them.
    If they are behind, give them a motivational tip about the benefits of water (e.g., better skin, concentration, energy).
    Keep your responses short, cheerful, and use water-related emojis 💧🌊✨.
    Respond in Korean as the user has requested the app in Korean.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "준비 중입니다! 물 한 잔하며 기다려주세요. 💧";
  }
}
