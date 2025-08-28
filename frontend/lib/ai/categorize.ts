import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
let model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]> | null = null;

function getModel() {
  if (!apiKey) return null;
  if (!model) {
    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "Gemini-2.0-Flash-Lite" });
  }
  return model;
}

export async function suggestCategory(description: string): Promise<string> {
  if (!description) return "Other";
  try {
    const m = getModel();
    if (!m) return "Other";
    const prompt = `Categorize this financial transaction into one of:
[Food & Dining, Travel, Rent, Shopping, Subscriptions, Utilities, Health, Other].

Transaction: "${description}"

Respond with ONLY the category name.`;
    const result = await m.generateContent(prompt);
    return result.response.text().trim() || "Other";
  } catch (err) {
    console.error("Gemini error:", err);
    return "Other";
  }
}
