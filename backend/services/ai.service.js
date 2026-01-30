import { GoogleGenAI } from "@google/genai";
import config from "../config/env.js";

const ai = new GoogleGenAI({ apiKey: config.AI_API_KEY });

const DEFAULT_RESULT = {
  intent: "General",
  sentiment: "NEUTRAL",
  urgency: "MEDIUM",
};

function buildPrompt(message) {
  return [
    "Analyze the customer inquiry message and respond with JSON only.",
    "Do not include code fences or prose.",
    "Fields: intent (string), sentiment (POSITIVE, NEUTRAL, NEGATIVE), urgency (LOW, MEDIUM, HIGH).",
    `Message: "${message}"`,
  ].join("\n");
}

function parseJsonResponse(text) {
  try {
    if (!text) return null;

    // Remove markdown code blocks if present.
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/```\n?/g, "");
    }

    return JSON.parse(cleanedText.trim());
  } catch (error) {
    console.error("JSON parse error:", error);
    return null;
  }
}

function normalizeResult(result) {
  if (!result || typeof result !== "object") {
    return DEFAULT_RESULT;
  }

  const intent = result.intent || DEFAULT_RESULT.intent;
  const sentiment = (result.sentiment || DEFAULT_RESULT.sentiment)
    .toString()
    .toUpperCase();
  const urgency = (result.urgency || DEFAULT_RESULT.urgency)
    .toString()
    .toUpperCase();

  return {
    intent,
    sentiment: ["POSITIVE", "NEUTRAL", "NEGATIVE"].includes(sentiment)
      ? sentiment
      : DEFAULT_RESULT.sentiment,
    urgency: ["LOW", "MEDIUM", "HIGH"].includes(urgency)
      ? urgency
      : DEFAULT_RESULT.urgency,
  };
}

async function analyzeMessage(message) {
  const prompt = buildPrompt(message);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const text = response.text;
    const parsed = parseJsonResponse(text);
    return normalizeResult(parsed);
  } catch (error) {
    console.error("Gemini AI service error", error?.message || error);
    return DEFAULT_RESULT;
  }
}

export { analyzeMessage };
