"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CameraIcon, UploadIcon } from "lucide-react";

interface CapturedImage {
  dataUrl: string;
  file: File | null;
}

export function FoodCapture({ onImageCaptured }: { onImageCaptured: (image: CapturedImage) => void }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // Handle camera capture
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
      });
    }
  };

  const captureImage = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");

    // Convert dataUrl to File
    const blobBin = atob(dataUrl.split(",")[1]);
    const array = [];
    for (let i = 0; i < blobBin.length; i++) {
      array.push(blobBin.charCodeAt(i));
    }
    const file = new Blob([new Uint8Array(array)], { type: "image/jpeg" });

    onImageCaptured({
      dataUrl,
      file: new File([file], "captured-food.jpg", { type: "image/jpeg" }),
    });

    stopCamera();
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach((track) => track.stop());
    setIsCapturing(false);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      onImageCaptured({ dataUrl, file });
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="p-4">
      {isCapturing ? (
        <div className="space-y-4">
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
          <div className="flex justify-center gap-2">
            <Button onClick={captureImage}>Capture</Button>
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
