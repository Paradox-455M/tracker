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

function fallbackCategoryFromKeywords(description: string): string | null {
  const text = description.toLowerCase();

  const mappings: Array<{ category: string; keywords: string[] }> = [
    { category: "Food & Dining", keywords: ["food", "zomato", "swiggy", "restaurant", "dine", "pizza", "burger", "cafe", "coffee", "sweet", "dessert", "icecream", "ice cream", "bakery", "cake", "pastry", "donut", "sweets"] },
    { category: "Groceries", keywords: ["grocery", "groceries", "bigbasket", "blinkit", "jiomart", "supermarket", "milk", "vegetable", "veggies", "fruit", "fruits"] },
    { category: "Subscriptions", keywords: ["netflix", "spotify", "youtube", "prime", "hotstar", "subscription", "subscript", "membership"] },
    { category: "Shopping", keywords: ["amazon", "flipkart", "myntra", "ajio", "store", "shopping", "order", "purchase"] },
    { category: "Transportation", keywords: ["uber", "ola", "cab", "ride", "taxi", "train", "bus", "metro", "fuel", "petrol", "diesel"] },
    { category: "Travel", keywords: ["flight", "hotel", "airbnb", "booking.com", "travel", "trip"] },
    { category: "Rent", keywords: ["rent", "landlord", "lease", "security deposit"] },
    { category: "Utilities", keywords: ["electricity", "power", "water", "gas", "wifi", "broadband", "internet", "recharge", "mobile bill", "phone bill"] },
    { category: "Health", keywords: ["doctor", "hospital", "clinic", "pharmacy", "medicine", "med", "fitness", "gym"] },
    { category: "Entertainment", keywords: ["movie", "cinema", "ticket", "game", "concert", "show"] },
  ];

  for (const mapping of mappings) {
    if (mapping.keywords.some((kw) => text.includes(kw))) {
      return mapping.category;
    }
  }

  return null;
}

export async function suggestCategory(description: string): Promise<string> {
  if (!description) return "Other";
  try {
    // Prefer a deterministic local mapping when available
    const localGuess = fallbackCategoryFromKeywords(description);
    if (localGuess) return localGuess;

    const m = getModel();
    if (!m) return "Other";
    const prompt = `You are an expert financial assistant. Your task is to categorize a transaction description into one of the following predefined categories:
[Food & Dining, Travel, Rent, Shopping, Subscriptions, Utilities, Health, Groceries, Entertainment, Transportation, Other].

Analyze the transaction description and respond with ONLY the most appropriate category name.

Here are some examples:
- Transaction: "Zomato" -> Category: "Food & Dining"
- Transaction: "Amazon" -> Category: "Shopping"
- Transaction: "Netflix" -> Category: "Subscriptions"
- Transaction: "Uber" -> Category: "Transportation"

Transaction: "${description}"

Category:`;
    const result = await m.generateContent(prompt);
    const category = result.response.text().trim();

    const validCategories = ["Food & Dining", "Travel", "Rent", "Shopping", "Subscriptions", "Utilities", "Health", "Groceries", "Entertainment", "Transportation", "Other"];
    if (validCategories.includes(category)) {
      return category;
    }

    return "Other";
  } catch (err) {
    console.error("Gemini error:", err);
    const localGuess = fallbackCategoryFromKeywords(description);
    return localGuess || "Other";
  }
}

export { fallbackCategoryFromKeywords };
