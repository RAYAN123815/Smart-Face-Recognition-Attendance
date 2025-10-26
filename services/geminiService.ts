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


export const generateAttendanceSummary = async (
    userName: string, 
    records: AttendanceRecord[],
    startDate: string,
    endDate: string
): Promise<string> => {
  if (!API_KEY) {
    return "AI features are disabled. Please configure your API key.";
  }

  if (new Date(startDate) > new Date(endDate)) {
    return "Invalid date range: Start date cannot be after end date.";
  }

  const presentDates = new Set(
    records.map(rec => new Date(rec.timestamp).toDateString())
  );

  const attendanceEntries: string[] = [];
  const currentDate = new Date(startDate + 'T00:00:00');
  const finalDate = new Date(endDate + 'T00:00:00');

  // Loop through the date range
  while (currentDate <= finalDate) {
    const isPresent = presentDates.has(currentDate.toDateString());
    const dateString = currentDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    attendanceEntries.push(`${dateString}: ${isPresent ? 'Present' : 'Absent'}`);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const attendanceString = attendanceEntries.join(', ');

  const prompt = `User ${userName}'s attendance from ${startDate} to ${endDate} is as follows: ${attendanceString}. Write a short, one-sentence summary of their attendance for this period. Be encouraging if attendance is good, and gently motivational if it's not.`;

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

    // Helper function for a single pairwise comparison
    const compareImages = async (imageA: any, imageB: any, description: string): Promise<boolean> => {
        const prompt = "You are a highly accurate face verification system. Is the person in 'Image A' the *exact same person* as in 'Image B'? Do not be lenient. If there is any doubt at all, respond 'no'. Your entire response must be a single word: either 'yes' or 'no'.";

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [
                    { text: prompt },
                    { text: "\n--- Image A ---" },
                    imageA,
                    { text: "\n--- Image B ---" },
                    imageB,
                ]},
            });
            const resultText = response.text.trim().toLowerCase().replace(/[.,!]/g, '');
            console.log(`AI comparison result for ${description}: "${resultText}"`);
            return resultText === 'yes';
        } catch (error) {
            console.error(`Error during AI comparison for ${description}:`, error);
            return false; // Treat errors as a non-match
        }
    };

    // Sequentially check each user.
    for (const user of users) {
        console.log(`--- Verifying against user: ${user.name} ---`);
        
        const registeredImageParts = {
            front: base64ToGenerativePart(user.images.front),
            left: base64ToGenerativePart(user.images.left),
            right: base64ToGenerativePart(user.images.right)
        };

        if (!registeredImageParts.front || !registeredImageParts.left || !registeredImageParts.right) {
            console.error(`One or more registered images are invalid for user ${user.name}`);
            continue; // Skip this user
        }

        let matchScore = 0;

        // Compare captured image against each of the three registered images
        if (await compareImages(capturedImagePart, registeredImageParts.front, `${user.name} - Front`)) {
            matchScore++;
        }
        if (await compareImages(capturedImagePart, registeredImageParts.left, `${user.name} - Left`)) {
            matchScore++;
        }
        if (await compareImages(capturedImagePart, registeredImageParts.right, `${user.name} - Right`)) {
            matchScore++;
        }

        console.log(`Final match score for ${user.name}: ${matchScore}`);

        // Require at least 2 of the 3 images to be a definite match
        if (matchScore >= 2) {
            console.log(`AI match CONFIRMED for user: ${user.name}`);
            return user; // Match found
        } else {
            console.log(`AI match FAILED for user: ${user.name}`);
        }
    }

    console.log("No match found by AI across all users.");
    return null; // No match found
};