
import { GoogleGenAI, Type } from "@google/genai";
import { getRollValue } from "../constants";
import { Difficulty } from "../types";

export interface AIResponse {
  decision: 'TRUST' | 'CHALLENGE' | 'CLAIM';
  claimedValue?: number;
  reasoning: string;
  commentary: string;
}

export const getAIDecision = async (
  gameState: {
    playerLastClaim: number;
    aiActualRoll?: number;
    history: any[];
    difficulty: Difficulty;
  }
): Promise<AIResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  
  const difficultyContext = {
    easy: "You are 'Drunk Hans'. You are very trusting and rarely challenge the player. Your bluffs are predictable and low-value. You are jovial and easily fooled.",
    medium: "You are 'Herr Meier'. You play with standard tavern intuition. You challenge fishy claims and bluff reasonably. You are a balanced opponent.",
    hard: "You are 'The Pro Gambler'. You are highly skeptical and analyze the player's history for patterns of lying. You bluff aggressively, often claiming 'Meier' to pressure the player. You are cunning and sharp-tongued."
  }[gameState.difficulty];

  const systemInstruction = `
    You are a digital version of the German game 'Meier'.
    ${difficultyContext}
    
    Ranking (Highest to Lowest):
    1. Meier (2-1) = 1000 pts
    2. Doubles (6-6 down to 1-1) = 600 pts down to 100 pts
    3. High-low digits (6-5, 6-4... 3-1) = 65, 64... 31 pts
    
    Gameplay Rules:
    - If reacting to a claim: Decide to CHALLENGE (say they lie) or TRUST.
    - If you trust, you ROLL and must CLAIM a value strictly higher than their previous claim.
    - If your actual roll is lower than the target, you MUST lie to stay in the game.
    - If your actual roll IS higher, you usually tell the truth but might over-claim to set a higher bar.
    
    Personality:
    - Maintain a salty, charismatic tavern regular persona.
  `;

  const prompt = `
    DIFFICULTY SETTING: ${gameState.difficulty.toUpperCase()}
    CURRENT STATE:
    - Target to beat (last claim): ${gameState.playerLastClaim}
    - Your actual dice value (if rolled): ${gameState.aiActualRoll || 'Waiting to roll'}
    - History of this match: ${JSON.stringify(gameState.history.slice(-5))}
    
    TASK:
    ${gameState.aiActualRoll 
      ? `You rolled ${gameState.aiActualRoll}. You MUST claim a value HIGHER than ${gameState.playerLastClaim}. What is your claim?`
      : `The player just claimed ${gameState.playerLastClaim}. Do you trust them or CHALLENGE?`
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            decision: { type: Type.STRING, enum: ['TRUST', 'CHALLENGE', 'CLAIM'] },
            claimedValue: { type: Type.NUMBER, description: "Numeric claim value > target." },
            reasoning: { type: Type.STRING },
            commentary: { type: Type.STRING, description: "Short tavern-style quip." }
          },
          required: ['decision', 'reasoning', 'commentary']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty AI response");
    return JSON.parse(text);
  } catch (error: any) {
    if (error?.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_ERROR");
    }
    throw error;
  }
};
