import { GoogleGenAI } from "@google/genai";
import { User, AttendanceRecord } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.warn("Gemini API key not found. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Converts a base64 image string to a GenerativePart object for the Gemini API.
 * @param base64 The base64 encoded image string.
 * @returns A GenerativePart object or null if the string is invalid.
 */
const base64ToGenerativePart = (base64: string) => {
    // Basic check for base64 format
    const match = base64.match(/^data:(image\/(?:jpeg|png));base64,(.*)$/);
    if (!match || match.length < 3) return null;
    return {
      inlineData: {
        mimeType: match[1],
        data: match[2],
      },
    };
};


export const generateAttendanceSummary = async (userName: string, records: AttendanceRecord[]): Promise<string> => {
  if (!API_KEY) {
    return "AI features are disabled. Please configure your API key.";
  }

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const attendanceString = days.map(day => {
    const present = records.some(rec => rec.day === day);
    return `${day}: ${present ? 'Present' : 'Absent'}`;
  }).join(', ');

  const prompt = `User ${userName}'s attendance for the week is as follows: ${attendanceString}. Write a short, one-sentence summary of their attendance. Be encouraging if attendance is good, and gently motivational if it's not.`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating summary with Gemini:", error);
    return "Could not generate AI summary. Please try again later.";
  }
};


export const verifyUserWithAi = async (capturedImageBase64: string, users: User[]): Promise<User | null> => {
    if (!API_KEY) {
        console.error("Cannot verify with AI: API key is not configured.");
        return null;
    }
    if (users.length === 0) {
        return null;
    }

    const capturedImagePart = base64ToGenerativePart(capturedImageBase64);
    if (!capturedImagePart) {
        console.error("Invalid captured image format.");
        return null;
    }

    // Sequentially check each user. In a production scenario, you might want a more optimized approach.
    for (const user of users) {
        console.log(`Verifying against user: ${user.name}`);
        const registeredImagePart = base64ToGenerativePart(user.images.front);
        if (!registeredImagePart) {
            console.error(`Invalid registered image for user ${user.name}`);
            continue; // Skip this user
        }

        const prompt = "Are these two images of the same person? Answer with only the word 'yes' or 'no'.";

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [
                    {text: prompt},
                    capturedImagePart, 
                    registeredImagePart
                ]},
            });
            
            const resultText = response.text.trim().toLowerCase();
            console.log(`AI response for ${user.name}: "${resultText}"`);

            if (resultText.includes('yes')) {
                console.log(`AI match found for user: ${user.name}`);
                return user; // Match found
            }
        } catch (error) {
            console.error(`Error verifying user ${user.name} with Gemini:`, error);
            // Continue to the next user even if one call fails
        }
    }

    console.log("No match found by AI across all users.");
    return null; // No match found
};
