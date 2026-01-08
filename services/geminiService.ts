
import { GoogleGenAI } from "@google/genai";

export const generateWorldDescription = async (sceneContext: string) => {
  // Always initialize right before making an API call and use process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      // Use the recommended model for basic text tasks
      model: 'gemini-3-flash-preview',
      contents: `You are an atmospheric narrator for a serene 3D nature game. 
      The player is currently looking at: ${sceneContext}.
      Write a short, poetic, two-sentence description of the surroundings in Portuguese (PT-BR) to enhance the player's immersion. 
      Focus on the light, the grass, and the peace of the green forest.`,
    });
    // Directly access the .text property
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "A brisa sopra suavemente através das folhas, sussurrando segredos da mata antiga.";
  }
};
