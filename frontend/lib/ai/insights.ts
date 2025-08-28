import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
let model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]> | null = null;

function getModel() {
  if (!apiKey) return null;
  if (!model) {
    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  }
  return model;
}

export async function generateWeeklyInsights(summary: unknown) {
  const m = getModel();
  if (!m) return "";
  const prompt = `
You are an AI financial advisor. Based on this weekly expense summary,
provide 3-4 concise insights. Tone: friendly, clear, helpful.

Weekly Summary:
${JSON.stringify(summary, null, 2)}

Example: "Your dining expenses rose by 20% compared to last week."
Only return bullet points.
`;
  const result = await m.generateContent(prompt);
  return result.response.text().trim();
}


