
import { GoogleGenAI, Type } from "@google/genai";
import { UserData, PasswordSuggestion } from "../types";

export const generatePasswords = async (userData: UserData, historyStrings: string[]): Promise<PasswordSuggestion[]> => {
  // Always initialize inside the function to ensure the most up-to-date environment variables are used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const recentHistory = historyStrings.slice(-40);
  
  const prompt = `
    Generate exactly 5 unique, secure, and non-repetitive 8-character passwords using parts of the following user data:
    - First Name: ${userData.firstName}
    - Last Name: ${userData.lastName}
    - Date of Birth: ${userData.dob}
    - Preferred Special Characters: ${userData.specialChars}

    STRICT REQUIREMENTS:
    1. LENGTH: Every single password MUST be EXACTLY 8 characters long.
    2. UNIQUENESS: Do not suggest any passwords found in this history: [${recentHistory.join(', ')}].
    3. CREATIVITY: Use leetspeak (e.g., a->4, e->3, s->5, i->1, o->0), reversals, and mixed case.
    4. VARIETY: Provide a mix of strengths and categories (e.g., "Social", "Banking", "Ultra-Secure").
    5. FORMAT: Return a JSON array of objects.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              value: { type: Type.STRING, description: "Exactly 8 character password" },
              strength: { type: Type.STRING, enum: ["weak", "medium", "strong"] },
              explanation: { type: Type.STRING, description: "Short explanation of the derivation" },
              category: { type: Type.STRING, description: "Suggested use case or style category" }
            },
            required: ["value", "strength", "explanation", "category"]
          }
        }
      }
    });

    const jsonStr = response.text || "[]";
    const parsed: any[] = JSON.parse(jsonStr);
    
    return parsed.map((p, index) => ({
      ...p,
      id: `gen-${Date.now()}-${index}`,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("Failed to generate secure suggestions. Please check your network or API configuration.");
  }
};
