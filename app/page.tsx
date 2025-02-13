import { FoodCaptureContainer } from "@/app/(features)/food-capture/container";

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">CalFood</h1>
      <FoodCaptureContainer />
    </main>
  );
}
