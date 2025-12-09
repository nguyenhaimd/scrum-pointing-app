import { GoogleGenAI, Type } from "@google/genai";
import { Story } from "../types";

// Initialize the Google GenAI SDK lazily to prevent immediate crashes if the key is missing on load.
let ai: GoogleGenAI | null = null;

const getApiKey = (): string | undefined => {
  // 1. Try standard process.env (Node/Vercel standard)
  if (typeof process !== 'undefined' && process.env?.API_KEY) {
    return process.env.API_KEY;
  }
  
  // 2. Try Vite-specific env access (User specific case: VITE_API_KEY)
  // We check both process.env and import.meta.env for VITE_API_KEY to be robust
  if (typeof process !== 'undefined' && process.env?.VITE_API_KEY) {
    return process.env.VITE_API_KEY;
  }

  // @ts-ignore - Handle Vite's import.meta.env
  if (typeof import.meta !== 'undefined' && import.meta.env) {
     // @ts-ignore
     if (import.meta.env.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
     // @ts-ignore
     if (import.meta.env.API_KEY) return import.meta.env.API_KEY;
  }
  
  return undefined;
};

const getAi = (): GoogleGenAI | null => {
  if (ai) return ai;

  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.warn("Gemini API Key is missing. AI features will be disabled.");
    return null;
  }

  ai = new GoogleGenAI({ apiKey });
  return ai;
};

export const enhanceStory = async (title: string): Promise<Partial<Story>> => {
  const client = getAi();
  if (!client) return {};

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `As an expert Agile Product Owner, please generate a detailed description and a list of 3-5 acceptance criteria for a user story with the title: "${title}".
      Return the response in JSON format.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            acceptanceCriteria: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['description', 'acceptanceCriteria']
        }
      }
    });

    const text = response.text;
    if (!text) return {};
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini enhancement failed:", error);
    return {};
  }
};

export const getAiChatResponse = async (
  message: string,
  currentStory?: Story | null
): Promise<string> => {
  const client = getAi();
  if (!client) return "I cannot reply right now (API Key missing).";

  try {
    const context = currentStory
      ? `The team is currently discussing the story: "${currentStory.title}". Description: ${currentStory.description}.`
      : "The team is currently between stories.";

    const systemPrompt = `You are Gemini, a helpful Agile Coach assisting a Scrum team during a poker planning session.
    ${context}
    Be concise, helpful, and encourage good agile practices. If asked about points, explain the relative complexity but don't decide for them.
    keep responses short (under 50 words unless asked for detail).`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return response.text || "I'm not sure what to say.";
  } catch (error) {
    console.error("Gemini chat failed:", error);
    return "I encountered an error processing that.";
  }
};

export const getChuckNorrisJoke = async (): Promise<string> => {
  const client = getAi();
  
  // Fallback if no API key, so the feature doesn't die completely
  if (!client) {
    return "Chuck Norris doesn't need an API Key. The code runs out of fear.";
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Generate a short, hilarious Chuck Norris fact that is related to software engineering, coding, git, or agile methodology. It should be a 'Chuck Norris Fact' style joke. Keep it punchy and under 30 words.",
      config: {
        temperature: 1.1,
      }
    });
    return response.text?.trim() || "Chuck Norris doesn't read code. He stares at the binary until it confesses.";
  } catch (error) {
    console.error("Chuck joke failed:", error);
    return "Chuck Norris pushes directly to main. And main likes it.";
  }
};