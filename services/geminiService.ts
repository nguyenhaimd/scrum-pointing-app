
import { GoogleGenAI, Type } from "@google/genai";
import { Story } from "../types";

// Initialize the Google GenAI SDK.
// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const enhanceStory = async (title: string): Promise<Partial<Story>> => {
  try {
    const response = await ai.models.generateContent({
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
  try {
    const context = currentStory
      ? `The team is currently discussing the story: "${currentStory.title}". Description: ${currentStory.description}.`
      : "The team is currently between stories.";

    const systemPrompt = `You are Gemini, a helpful Agile Coach assisting a Scrum team during a poker planning session.
    ${context}
    Be concise, helpful, and encourage good agile practices. If asked about points, explain the relative complexity but don't decide for them.
    keep responses short (under 50 words unless asked for detail).`;

    const response = await ai.models.generateContent({
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
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Tell me a unique, short, and very funny Chuck Norris fact or meme quote. Keep it under 25 words. Mix it up between coding memes and classic feats of strength.",
    });
    return response.text?.trim() || "Chuck Norris doesn't read code. He stares at the binary until it confesses.";
  } catch (error) {
    console.error("Chuck joke failed:", error);
    return "Time waits for no man. Unless that man is Chuck Norris.";
  }
};
