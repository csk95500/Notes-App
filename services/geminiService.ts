import { GoogleGenAI } from "@google/genai";
import { AIAction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are an intelligent writing assistant embedded in a note-taking app. 
Your goal is to help the user organize thoughts, improve clarity, and generate content based on their notes.
You should use Markdown formatting (bold, italics, lists, headers) to structure your responses effectively.
Keep responses concise and directly applicable to the note context.`;

export const generateAIContent = async (
  action: AIAction,
  currentContent: string,
  userPrompt?: string
): Promise<string> => {
  try {
    let prompt = "";

    switch (action) {
      case AIAction.SUMMARIZE:
        prompt = `Summarize the following note concisely using Markdown:\n\n${currentContent}`;
        break;
      case AIAction.CONTINUE:
        prompt = `Continue writing the following note, maintaining the style and tone. Use Markdown where appropriate:\n\n${currentContent}`;
        break;
      case AIAction.FIX_GRAMMAR:
        prompt = `Fix grammar and spelling in the following text, maintaining the original meaning. Return the corrected text in Markdown:\n\n${currentContent}`;
        break;
      case AIAction.ACTION_ITEMS:
        prompt = `Extract a checklist of actionable items from this note. Use Markdown checkboxes (- [ ]):\n\n${currentContent}`;
        break;
      case AIAction.GENERATE_IDEAS:
        prompt = `Generate 5 creative ideas related to this note's topic. Format as a Markdown list:\n\n${currentContent}\n\nAdditional context: ${userPrompt || ''}`;
        break;
      default:
        prompt = userPrompt ? `${userPrompt}\n\nContext:\n${currentContent}` : currentContent;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating AI response. Please check your API key or try again.";
  }
};