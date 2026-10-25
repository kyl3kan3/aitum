/**
 * AI Service for ingredient analysis and recipe generation
 * Uses OpenAI's GPT-5.2 vision model to analyze food images
 */

import * as FileSystem from "expo-file-system";
import { isOpenAIConfigured, postOpenAIResponses } from "@/lib/openai-http";

export interface AnalyzedIngredient {
  name: string;
  quantity?: string;
  category: "protein" | "vegetable" | "fruit" | "dairy" | "grain" | "spice" | "other";
}

export interface GeneratedRecipe {
  id: string;
  title: string;
  description: string;
  cookTime: string;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  ingredients: string[];
  instructions: string[];
  tips?: string;
}

export interface AnalysisResult {
  ingredients: AnalyzedIngredient[];
  recipes: GeneratedRecipe[];
}

/**
 * Analyze an image to detect ingredients
 */
export async function analyzeIngredients(imageUri: string): Promise<AnalyzedIngredient[]> {
  if (!isOpenAIConfigured()) {
    throw new Error("OpenAI API key not configured");
  }

  // Read image as base64
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const mimeType = imageUri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const response = await postOpenAIResponses({
      model: "gpt-5.2",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Analyze this image and identify all food ingredients you can see.

Return a JSON array of ingredients with this format:
[
  { "name": "ingredient name", "quantity": "estimated amount if visible", "category": "protein|vegetable|fruit|dairy|grain|spice|other" }
]

Only return the JSON array, no other text. If no food items are visible, return an empty array [].`,
            },
            {
              type: "input_image",
              image_url: dataUrl,
            },
          ],
        },
      ],
    });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenAI API error:", error);
    throw new Error("Failed to analyze image");
  }

  const data = await response.json();
  const content = data.output?.[0]?.content?.[0]?.text || "[]";

  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const ingredients = JSON.parse(jsonStr);
    return Array.isArray(ingredients) ? ingredients : [];
  } catch (e) {
    console.error("Failed to parse ingredients:", e);
    return [];
  }
}

/**
 * Generate recipe suggestions based on ingredients
 */
export async function generateRecipes(ingredients: AnalyzedIngredient[]): Promise<GeneratedRecipe[]> {
  if (!isOpenAIConfigured()) {
    throw new Error("OpenAI API key not configured");
  }

  if (ingredients.length === 0) {
    return [];
  }

  const ingredientList = ingredients.map((i) => i.name).join(", ");

  const response = await postOpenAIResponses({
      model: "gpt-5.2",
      input: [
        {
          role: "user",
          content: `Given these ingredients: ${ingredientList}

Generate 3 creative recipe suggestions that can be made with these ingredients (you may assume basic pantry staples like salt, pepper, oil, etc. are available).

Return a JSON array with this format:
[
  {
    "id": "unique-id",
    "title": "Recipe Name",
    "description": "Brief appetizing description",
    "cookTime": "X mins",
    "servings": 2,
    "difficulty": "Easy|Medium|Hard",
    "ingredients": ["ingredient 1 with amount", "ingredient 2 with amount"],
    "instructions": ["Step 1", "Step 2", "Step 3"],
    "tips": "Optional cooking tip"
  }
]

Only return the JSON array, no other text.`,
        },
      ],
    });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate recipes");
  }

  const data = await response.json();
  const content = data.output?.[0]?.content?.[0]?.text || "[]";

  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const recipes = JSON.parse(jsonStr);
    return Array.isArray(recipes) ? recipes : [];
  } catch (e) {
    console.error("Failed to parse recipes:", e);
    return [];
  }
}

/**
 * Analyze image and generate recipes in one call
 */
export async function analyzeAndGenerateRecipes(imageUri: string): Promise<AnalysisResult> {
  if (!isOpenAIConfigured()) {
    throw new Error("OpenAI API key not configured");
  }

  // Read image as base64
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const mimeType = imageUri.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const response = await postOpenAIResponses({
      model: "gpt-5.2",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Analyze this image of food/ingredients and:
1. Identify all visible ingredients
2. Suggest 3 recipes that can be made with these ingredients (assume basic pantry staples are available)

Return JSON in this exact format:
{
  "ingredients": [
    { "name": "ingredient name", "quantity": "amount if visible", "category": "protein|vegetable|fruit|dairy|grain|spice|other" }
  ],
  "recipes": [
    {
      "id": "unique-id-1",
      "title": "Recipe Name",
      "description": "Brief appetizing description",
      "cookTime": "X mins",
      "servings": 2,
      "difficulty": "Easy",
      "ingredients": ["ingredient 1 with amount", "ingredient 2 with amount"],
      "instructions": ["Step 1", "Step 2", "Step 3"],
      "tips": "Optional cooking tip"
    }
  ]
}

Only return valid JSON, no other text. If no food items visible, return {"ingredients": [], "recipes": []}.`,
            },
            {
              type: "input_image",
              image_url: dataUrl,
            },
          ],
        },
      ],
    });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenAI API error:", error);
    throw new Error("Failed to analyze image");
  }

  const data = await response.json();
  const content = data.output?.[0]?.content?.[0]?.text || '{"ingredients": [], "recipes": []}';

  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const result = JSON.parse(jsonStr);
    return {
      ingredients: Array.isArray(result.ingredients) ? result.ingredients : [],
      recipes: Array.isArray(result.recipes) ? result.recipes : [],
    };
  } catch (e) {
    console.error("Failed to parse analysis result:", e);
    return { ingredients: [], recipes: [] };
  }
}

/**
 * Check if AI service is available
 */
export function isAIServiceAvailable(): boolean {
  return isOpenAIConfigured();
}
