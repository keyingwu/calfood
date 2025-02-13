import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();
    console.log("Received image URL:", imageUrl.substring(0, 100) + "...");

    console.log("Making request to Qwen...");
    const response = await openai.chat.completions.create({
      model: "qwen-vl-plus-2025-01-25",
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text",
              text: "You are a helpful assistant that analyzes food images. Please provide detailed information about ingredients, including their weights, total calories, and calories per gram.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
            {
              type: "text",
              text: '请分析图片中的食物，列出所有成分，并为每个成分提供：估计重量（克）、总热量（千卡）、以及单位重量热量（千卡/克）。请以JSON格式返回，格式为：{"ingredients": [{"name": "食材名", "weight": 重量数字, "calories": 总热量数字, "caloriesPerGram": 单位重量热量数字}]}',
            },
          ],
        },
      ],
    });

    console.log("Qwen response:", response);
    const content = response.choices[0].message.content;
    console.log("Raw content from Qwen:", content);

    let parsedContent;
    try {
      const cleanContent = content?.replace(/```json\n|\n```/g, "") || "{}";
      parsedContent = JSON.parse(cleanContent);
      console.log("Successfully parsed JSON:", parsedContent);
    } catch (e) {
      console.log("Failed to parse JSON, attempting text extraction");
      const ingredients = extractIngredientsFromText(content || "");
      parsedContent = { ingredients };
      console.log("Extracted ingredients from text:", parsedContent);
    }

    return NextResponse.json(parsedContent);
  } catch (error) {
    console.error("Analysis error:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json({ error: "Failed to analyze food image" }, { status: 500 });
  }
}

function extractIngredientsFromText(text: string): Array<{ name: string; weight: number; calories: number; caloriesPerGram: number }> {
  console.log("Attempting to extract ingredients from text:", text);
  // Updated regex pattern to extract calories per gram
  const pattern = /([^0-9]+)(\d+)克.*?(\d+)千卡.*?(\d+\.?\d*)千卡\/克/g;
  const ingredients = [];
  let match;

  while ((match = pattern.exec(text)) !== null) {
    console.log("Found match:", match);
    ingredients.push({
      name: match[1].trim(),
      weight: parseInt(match[2]),
      calories: parseInt(match[3]),
      caloriesPerGram: parseFloat(match[4]),
    });
  }

  console.log("Extracted ingredients:", ingredients);
  return ingredients;
}
