"use client";

import { useState, useRef } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CameraIcon, UploadIcon } from "lucide-react";

interface CapturedImage {
  dataUrl: string;
  file: File | null;
}

const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB
const TARGET_IMAGE_SIZE = 1200;
const MIN_COMPRESSION_QUALITY = 0.5;
const MAX_COMPRESSION_QUALITY = 0.9;

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "environment",
};

async function compressImage(dataUrl: string, targetSize = MAX_IMAGE_SIZE): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > height && width > TARGET_IMAGE_SIZE) {
        height = Math.round((height * TARGET_IMAGE_SIZE) / width);
        width = TARGET_IMAGE_SIZE;
      } else if (height > TARGET_IMAGE_SIZE) {
        width = Math.round((width * TARGET_IMAGE_SIZE) / height);
        height = TARGET_IMAGE_SIZE;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Binary search for optimal compression quality
      let minQuality = MIN_COMPRESSION_QUALITY;
      let maxQuality = MAX_COMPRESSION_QUALITY;
      let resultDataUrl = canvas.toDataURL("image/jpeg", maxQuality);
      let iterations = 0;
      const MAX_ITERATIONS = 5;

      while (iterations < MAX_ITERATIONS) {
        const midQuality = (minQuality + maxQuality) / 2;
        const currentDataUrl = canvas.toDataURL("image/jpeg", midQuality);
        const size = Math.ceil((currentDataUrl.length * 3) / 4); // Estimate base64 size

        if (Math.abs(size - targetSize) < 1024 || maxQuality - minQuality < 0.01) {
          resultDataUrl = currentDataUrl;
          break;
        }

        if (size > targetSize) {
          maxQuality = midQuality;
        } else {
          minQuality = midQuality;
          resultDataUrl = currentDataUrl; // Keep the best result so far
        }

        iterations++;
      }

      resolve(resultDataUrl);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export function FoodCapture({ onImageCaptured }: { onImageCaptured: (image: CapturedImage) => void }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const { toast } = useToast();

  const startCamera = () => {
    setIsCapturing(true);
  };

  const stopCamera = () => {
    setIsCapturing(false);
  };

  const captureImage = async () => {
    if (!webcamRef.current) return;

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error("Failed to capture image");
      }

      const compressedDataUrl = await compressImage(imageSrc);

      // Convert dataUrl to File
      const blobBin = atob(compressedDataUrl.split(",")[1]);
      const array = [];
      for (let i = 0; i < blobBin.length; i++) {
        array.push(blobBin.charCodeAt(i));
      }
      const file = new Blob([new Uint8Array(array)], { type: "image/jpeg" });

      onImageCaptured({
        dataUrl: compressedDataUrl,
        file: new File([file], "captured-food.jpg", { type: "image/jpeg" }),
      });

      stopCamera();
    } catch (error) {
      console.error("Image capture error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to capture image. Please try again.",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const dataUrl = reader.result as string;
          const compressedDataUrl = await compressImage(dataUrl);
          onImageCaptured({ dataUrl: compressedDataUrl, file });
        } catch (error) {
          console.error("Image compression error:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to process image. Please try again.",
          });
        }
      };
      reader.readAsDataURL(file);
    } else {
      // If file is already small enough, process it directly
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onImageCaptured({ dataUrl, file });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className="p-4">
      {isCapturing ? (
        <div className="space-y-4">
          <div className="relative aspect-video">
            <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" videoConstraints={videoConstraints} className="w-full h-full rounded-lg" />
          </div>
          <div className="flex justify-center gap-2">
            <Button onClick={captureImage}>
              <CameraIcon className="mr-2 h-4 w-4" />
              Capture
            </Button>
            <Button variant="outline" onClick={stopCamera}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Button onClick={startCamera}>
            <CameraIcon className="mr-2 h-4 w-4" />
            Take Photo
          </Button>
          <div className="relative">
            <Button variant="outline" className="w-full">
              <UploadIcon className="mr-2 h-4 w-4" />
              Upload Photo
            </Button>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
          </div>
        </div>
      )}
    </Card>
  );
}
