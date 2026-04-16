/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DailyContent, JLPTLevel, ExerciseType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateDailyContent(
  level: JLPTLevel,
  exerciseTypes: ExerciseType[]
): Promise<DailyContent> {
  const prompt = `Generate JLPT ${level} study content for today. 
  Include:
  1. 3 vocabulary words with kanji, reading, meaning, and one example sentence with translation.
  2. 1 grammar point with title, explanation, and one example sentence with translation.
  3. One exercise for each of these types: ${exerciseTypes.join(", ")}.
  
  Ensure all content is accurate for the ${level} level.
  For listening exercises, provide a short dialogue or sentence in Japanese that would be heard.
  For reading, provide a short paragraph (3-4 sentences) and a question about it.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          words: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                kanji: { type: Type.STRING },
                reading: { type: Type.STRING },
                meaning: { type: Type.STRING },
                example: { type: Type.STRING },
                exampleMeaning: { type: Type.STRING },
              },
              required: ["id", "kanji", "reading", "meaning", "example", "exampleMeaning"],
            },
          },
          grammar: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                explanation: { type: Type.STRING },
                example: { type: Type.STRING },
                exampleMeaning: { type: Type.STRING },
              },
              required: ["id", "title", "explanation", "example", "exampleMeaning"],
            },
          },
          exercises: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING },
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                answer: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ["id", "type", "question", "answer", "explanation"],
            },
          },
        },
        required: ["words", "grammar", "exercises"],
      },
    },
  });

  const content = JSON.parse(response.text || "{}");
  return {
    date: new Date().toISOString().split('T')[0],
    level,
    ...content,
  };
}

export async function textToSpeech(text: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: `Read this Japanese text naturally: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore is a good voice for Japanese
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("Failed to generate audio");
  }
  return base64Audio;
}
