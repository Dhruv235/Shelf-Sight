import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

let model: cocoSsd.ObjectDetection | null = null;
let modelLoading: Promise<cocoSsd.ObjectDetection> | null = null;

const FILTERED_CLASSES = [
  "person",
  "dog",
  "cat",
  "bird",
  "horse",
  "sheep",
  "cow",
  "elephant",
  "bear",
  "zebra",
  "giraffe",
];

const HIGH_PRIORITY_ITEMS = [
  "bottle",
  "cup",
  "bowl",
  "banana",
  "apple",
  "sandwich",
  "orange",
  "broccoli",
  "carrot",
  "pizza",
  "cake",
  "chair",
  "potted plant",
  "book",
  "clock",
  "vase",
  "scissors",
  "teddy bear",
  "toothbrush",
  "cell phone",
  "laptop",
  "keyboard",
  "remote",
  "wine glass",
  "fork",
  "knife",
  "spoon",
];

export interface CocoDetection {
  class: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  position: "left" | "center" | "right";
  isFallback: true;
}

export async function loadCocoModel(): Promise<cocoSsd.ObjectDetection> {
  if (model) return model;

  if (modelLoading) return modelLoading;

  modelLoading = (async () => {
    await tf.ready();
    const loadedModel = await cocoSsd.load({ base: "lite_mobilenet_v2" });
    model = loadedModel;
    return loadedModel;
  })();

  return modelLoading;
}

export function isModelLoaded(): boolean {
  return model !== null;
}

function determinePosition(
  centerX: number,
  imageWidth: number
): "left" | "center" | "right" {
  const relativePos = centerX / imageWidth;
  if (relativePos < 0.35) return "left";
  if (relativePos > 0.65) return "right";
  return "center";
}

function calculateBlurScore(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): number {
  const sampleSize = Math.min(100, width, height);
  const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
  const data = imageData.data;

  let sum = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += gray;
    count++;
  }

  const avg = sum / count;
  let variance = 0;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    variance += Math.pow(gray - avg, 2);
  }

  return variance / count;
}

export async function detectWithCoco(
  imageElement: HTMLImageElement | HTMLCanvasElement,
  confidenceThreshold = 0.45
): Promise<CocoDetection[]> {
  const cocoModel = await loadCocoModel();

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Could not create canvas context");

  const width =
    imageElement instanceof HTMLImageElement
      ? imageElement.naturalWidth
      : imageElement.width;
  const height =
    imageElement instanceof HTMLImageElement
      ? imageElement.naturalHeight
      : imageElement.height;

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(imageElement, 0, 0, width, height);

  const blurScore = calculateBlurScore(ctx, width, height);
  const isBlurry = blurScore < 50;

  if (isBlurry) {
    console.log("Image appears blurry, lowering confidence threshold");
  }

  const effectiveThreshold = isBlurry
    ? confidenceThreshold * 0.8
    : confidenceThreshold;

  const predictions = await cocoModel.detect(canvas);

  const detections: CocoDetection[] = [];

  for (const pred of predictions) {
    const className = pred.class.toLowerCase();
    const isFiltered = FILTERED_CLASSES.includes(className);

    if (pred.score >= effectiveThreshold && !isFiltered) {
      const [x, y, predWidth, predHeight] = pred.bbox;
      const centerX = x + predWidth / 2;
      const centerY = y + predHeight / 2;

      const isPriority = HIGH_PRIORITY_ITEMS.includes(className);
      const adjustedConfidence = Math.min(
        pred.score * (isPriority ? 1.1 : 1.0),
        1.0
      );

      detections.push({
        class: className,
        confidence: adjustedConfidence,
        x: centerX,
        y: centerY,
        width: predWidth,
        height: predHeight,
        position: determinePosition(centerX, width),
        isFallback: true,
      });
    }
  }

  return detections.sort((a, b) => b.confidence - a.confidence);
}

export async function detectFromUrl(
  imageUrl: string,
  confidenceThreshold = 0.45
): Promise<CocoDetection[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = async () => {
      try {
        const detections = await detectWithCoco(img, confidenceThreshold);
        resolve(detections);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = imageUrl;
  });
}

export function matchCocoDetections(
  detections: CocoDetection[],
  query: string
): CocoDetection[] {
  const normalizedQuery = query.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/);

  return detections.filter((detection) => {
    const detectionClass = detection.class.toLowerCase();

    if (detectionClass.includes(normalizedQuery)) return true;
    if (normalizedQuery.includes(detectionClass)) return true;

    for (const word of queryWords) {
      if (word.length >= 3 && detectionClass.includes(word)) return true;
      if (word.length >= 3 && detectionClass.startsWith(word)) return true;
    }

    return false;
  });
}
