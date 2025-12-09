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

export const getChuckNorrisJoke = (): string => {
  const jokes = [
    // Software Engineering Jokes
    "Chuck Norris doesn't test code. He stares at it until it confesses.",
    "Chuck Norris can compile syntax errors.",
    "Chuck Norris doesn't need a debugger, he just stares down the bug until the code apologizes.",
    "Chuck Norris writes code that optimizes itself.",
    "Chuck Norris can access the DB from the UI.",
    "When Chuck Norris throws exceptions, it's across the room.",
    "Chuck Norris can binary search unsorted data.",
    "Chuck Norris acts as the break condition for all recursive functions.",
    "Chuck Norris's keyboard doesn't have a Ctrl key because nothing controls Chuck Norris.",
    "Chuck Norris can delete the Recycle Bin.",
    "Chuck Norris can unit test entire applications with a single assert.",
    "The only design pattern Chuck Norris knows is the God Object.",
    "Chuck Norris can write infinite loops that finish in 4 seconds.",
    "Chuck Norris never gets a NullPointerException because nothing dares to be null for Chuck Norris.",
    "Chuck Norris doesn't push to master. Master pulls from Chuck Norris.",
    "Chuck Norris can persist data to /dev/null.",
    "When Chuck Norris presses F5, the server refreshes.",
    "Chuck Norris's code is self-documenting because the comments are afraid to be wrong.",
    "Chuck Norris triggers async events synchronously.",
    "Chuck Norris can make a class that is both abstract and final.",
    "Chuck Norris can instantiate an interface.",
    "Chuck Norris doesn't need garbage collection because he doesn't make garbage.",
    "Chuck Norris can resolve merge conflicts without looking at the code.",
    "Chuck Norris's git history is immutable.",
    "When Chuck Norris does a git push, he pushes the server.",
    "Chuck Norris can read a QR code.",
    "Chuck Norris can write multi-threaded applications with a single thread.",
    "Chuck Norris can override a final method.",
    "Chuck Norris can access private members of any class.",
    "Chuck Norris doesn't use web standards as the web will conform to him.",
    "Chuck Norris can run an infinite loop in O(1).",
    "Chuck Norris can take a screenshot of his blue screen of death.",
    "Chuck Norris can recite Pi to the last digit.",
    "Chuck Norris can download hardware.",
    "Chuck Norris performs garbage collection manually... with a shotgun.",
    "Chuck Norris can divide by zero.",
    "Chuck Norris can retrieve data from /dev/null.",
    "Chuck Norris doesn't check for errors, errors check for Chuck Norris.",
    "Chuck Norris can touch MC Hammer.",
    "Chuck Norris can use GOTO in Java.",
    "Chuck Norris can squeeze orange juice out of a lemon.",
    "Chuck Norris can win a game of Connect Four in three moves.",
    "Chuck Norris can slam a revolving door.",
    "Chuck Norris can strangle you with a cordless phone.",
    "Chuck Norris can kill two stones with one bird.",
    "Chuck Norris can build a snowman out of rain.",
    "Chuck Norris can make a fire by rubbing two ice cubes together.",
    "Chuck Norris can speak Braille.",
    "Chuck Norris can hear sign language.",
    "Chuck Norris can unscramble an egg.",
    "Chuck Norris can drown a fish.",
    "Chuck Norris can believe it's not butter.",
    "Chuck Norris can watch the radio.",
    "Chuck Norris can tie his shoes with his feet.",
    "Chuck Norris can gargle peanut butter.",
    "Chuck Norris can sneeze with his eyes open.",
    "Chuck Norris can clap with one hand.",
    "Chuck Norris can count to infinity. Twice.",
    "Chuck Norris can hear a pin drop in a haystack.",
    "Chuck Norris can taste the rainbow.",
    "Chuck Norris can see around corners.",
    "Chuck Norris can find a needle in a haystack.",
    "Chuck Norris can make onions cry.",
    "Chuck Norris can catch a cold.",
    "Chuck Norris can start a fire with a magnifying glass at night.",
    "Chuck Norris can play the violin with a piano.",
    "Chuck Norris can do a wheelie on a unicycle.",
    "Chuck Norris can juggle with one hand.",
    "Chuck Norris can skip a stone across the ocean.",
    "Chuck Norris can hold his breath for a month.",
    "Chuck Norris can jump over the moon.",
    "Chuck Norris can run faster than his shadow.",
    "Chuck Norris can lift a car with one finger.",
    "Chuck Norris can break a diamond with a hammer.",
    "Chuck Norris can drink a gallon of milk in 10 seconds.",
    "Chuck Norris can eat a whole watermelon in one bite.",
    "Chuck Norris can catch a bullet with his teeth.",
    "Chuck Norris can stop a train with his bare hands.",
    "Chuck Norris can fly without a plane.",
    "Chuck Norris can swim through land.",
    "Chuck Norris can walk on water.",
    "Chuck Norris can see in the dark.",
    "Chuck Norris can hear a whisper from a mile away.",
    "Chuck Norris can smell fear.",
    "Chuck Norris can taste victory.",
    "Chuck Norris can feel the force.",
    "Chuck Norris can predict the future.",
    "Chuck Norris can change the past.",
    "Chuck Norris can control the weather.",
    "Chuck Norris can telepathically communicate with animals.",
    "Chuck Norris can move objects with his mind.",
    "Chuck Norris can time travel.",
    "Chuck Norris can regenerate limbs.",
    "Chuck Norris can live forever.",
    "Chuck Norris doesn't sleep; he waits.",
    "Chuck Norris has counted to infinity. Twice.",
    "Chuck Norris acts as the main server for the internet.",
    "Chuck Norris can parse HTML with Regex.",
    "Chuck Norris ignores the same origin policy.",
    "Chuck Norris doesn't use sudo, the shell just assumes it's him.",
    "Chuck Norris can SSH into a machine without an IP address.",
    "Chuck Norris can overclock a calculator.",
    "Chuck Norris doesn't need a try-catch block, he catches everything.",
    "Chuck Norris can determine the halting problem.",
    "Chuck Norris can sort a list in O(1).",
    "Chuck Norris can convert PDF to Word by staring at the monitor.",
    "Chuck Norris doesn't get 404 errors, the web finds the page for him.",
    "Chuck Norris can perform a DDoS attack with a single packet.",
    "Chuck Norris can brute force a 256-bit key by hand.",
    "Chuck Norris can decrypt an MD5 hash.",
    "Chuck Norris can write a GUI in Assembly.",
    "Chuck Norris doesn't define variables, they define themselves out of fear.",
    "Chuck Norris can bypass the firewall by looking at it.",
    "Chuck Norris creates cloud infrastructure by exhaling.",
    "Chuck Norris can deploy to production on Friday at 5pm without errors.",
    "Chuck Norris can fix a bug before it is written.",
    "Chuck Norris's keyboard creates code as soon as he touches it.",
    "Chuck Norris can revert a commit on a whiteboard.",
    "Chuck Norris doesn't use APIs; the data comes to him.",
    "Chuck Norris can write binary code with a pencil.",
    "Chuck Norris is the reason why Waldo is hiding.",
    "Chuck Norris doesn't update dependencies; they update themselves to be compatible with him."
  ];
  return jokes[Math.floor(Math.random() * jokes.length)];
};
