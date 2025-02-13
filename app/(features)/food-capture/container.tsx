"use client";

import { useState } from "react";
import { FoodCapture } from "./food-capture";
import { FoodPreview } from "./food-preview";
import { EditableAnalysisResults } from "./editable-analysis-results";
import { useFoodAnalysis } from "@/hooks/use-food-analysis";

interface CapturedImage {
  dataUrl: string;
  file: File | null;
}

interface Ingredient {
  name: string;
  weight: number;
  calories: number;
}

export function FoodCaptureContainer() {
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null);
  const { analyzeFood, isAnalyzing, error, result } = useFoodAnalysis();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editedIngredients, setEditedIngredients] = useState<Ingredient[]>([]);

  const handleImageCaptured = async (image: CapturedImage) => {
    setCapturedImage(image);
    await analyzeFood(image.dataUrl);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setEditedIngredients([]);
  };

  const handleIngredientsChange = (ingredients: Ingredient[]) => {
    setEditedIngredients(ingredients);
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      {capturedImage ? (
        <>
          <FoodPreview imageUrl={capturedImage.dataUrl} onRetake={handleRetake} />
          <EditableAnalysisResults 
            isAnalyzing={isAnalyzing} 
            error={error} 
            results={result ? {
              ingredients: result.ingredients.map(ingredient => ({
                ...ingredient,
                caloriesPerGram: ingredient.calories / ingredient.weight
              }))
            } : null}
            onRetry={() => analyzeFood(capturedImage.dataUrl)}
            onChange={handleIngredientsChange}
          />
        </>
      ) : (
        <FoodCapture onImageCaptured={handleImageCaptured} />
      )}
    </div>
  );
}
