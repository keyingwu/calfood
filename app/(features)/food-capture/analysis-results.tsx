import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Ingredient {
  name: string;
  weight: number;
  calories: number;
}

interface AnalysisResultsProps {
  isAnalyzing: boolean;
  error: string | null;
  results: { ingredients: Ingredient[] } | null;
  onRetry: () => void;
}

export function AnalysisResults({ isAnalyzing, error, results, onRetry }: AnalysisResultsProps) {
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

  if (!results?.ingredients.length) {
    return null;
  }

  const totalCalories = results.ingredients.reduce((sum, item) => sum + item.calories, 0);

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Analysis Results</h3>
      <div className="space-y-2">
        {results.ingredients.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <span>{item.name}</span>
            <span className="text-sm text-muted-foreground">
              {item.weight}g ({item.calories} kcal)
            </span>
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
