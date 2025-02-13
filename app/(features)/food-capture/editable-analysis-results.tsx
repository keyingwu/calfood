"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Ingredient {
  name: string;
  weight: number;
  calories: number;
  caloriesPerGram: number;
}

interface EditableAnalysisResultsProps {
  isAnalyzing: boolean;
  error: string | null;
  results: { ingredients: Ingredient[] } | null;
  onRetry: () => void;
  onChange?: (ingredients: Ingredient[]) => void;
}

export function EditableAnalysisResults({ isAnalyzing, error, results, onRetry, onChange }: EditableAnalysisResultsProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  useEffect(() => {
    if (results?.ingredients) {
      setIngredients(
        results.ingredients.map((item) => ({
          ...item,
          caloriesPerGram: item.caloriesPerGram || item.calories / item.weight,
        }))
      );
    }
  }, [results]);

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = ingredients.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item };
        if (field === "name") {
          updatedItem.name = value;
        } else {
          const numValue = parseFloat(value) || 0;
          updatedItem[field] = numValue;

          // Update calories based on weight if weight is changed
          if (field === "weight") {
            updatedItem.calories = Math.round(numValue * updatedItem.caloriesPerGram);
          }
          // Update caloriesPerGram and calories if calories is changed directly
          else if (field === "calories") {
            updatedItem.caloriesPerGram = numValue / updatedItem.weight;
          }
        }
        return updatedItem;
      }
      return item;
    });

    setIngredients(updated);
    onChange?.(updated);
  };

  if (isAnalyzing) {
    return (
      <Card className="p-4 space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={onRetry}>Retry Analysis</Button>
      </Card>
    );
  }

  if (results?.ingredients.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>分析失败</AlertTitle>
        <AlertDescription>未识别到食物，请重新拍摄或上传清晰的食物图片</AlertDescription>
        <Button onClick={onRetry} variant="outline" className="mt-4 w-full">
          重新分析
        </Button>
      </Alert>
    );
  }

  if (!ingredients.length) {
    return null;
  }

  const totalCalories = ingredients.reduce((sum, item) => sum + item.calories, 0);

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Analysis Results</h3>
      <div className="space-y-4">
        {ingredients.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Name</Label>
                <Input value={item.name} onChange={(e) => updateIngredient(index, "name", e.target.value)} />
              </div>
              <div>
                <Label>Weight (g)</Label>
                <Input type="number" value={item.weight} onChange={(e) => updateIngredient(index, "weight", e.target.value)} />
              </div>
              <div>
                <Label>Calories</Label>
                <Input type="number" value={item.calories} onChange={(e) => updateIngredient(index, "calories", e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        <div className="border-t pt-2 mt-4">
          <div className="flex justify-between items-center font-semibold">
            <span>Total Calories</span>
            <span>{totalCalories} kcal</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
