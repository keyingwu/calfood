import { Button } from "@/components/ui/button";

interface FoodPreviewProps {
  imageUrl: string;
  onRetake: () => void;
}

export function FoodPreview({ imageUrl, onRetake }: FoodPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg">
        <img src={imageUrl} alt="Captured food" className="object-cover w-full h-full" />
      </div>
      <Button variant="outline" onClick={onRetake}>
        Retake Photo
      </Button>
    </div>
  );
}
