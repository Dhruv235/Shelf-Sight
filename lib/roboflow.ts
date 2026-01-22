export interface RoboflowPrediction {
  class: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoboflowResponse {
  predictions?: RoboflowPrediction[];
  time?: number;
  image?: {
    width: number;
    height: number;
  };
}

export async function roboflowDetect(imageBytes: Uint8Array): Promise<RoboflowResponse> {
  const apiKey = process.env.ROBOFLOW_API_KEY;
  const model = process.env.ROBOFLOW_MODEL;
  const version = process.env.ROBOFLOW_VERSION;

  if (!apiKey || !model || !version) {
    throw new Error("Missing ROBOFLOW env vars");
  }

  const url = `https://detect.roboflow.com/${model}/${version}?api_key=${apiKey}`;

  const form = new FormData();

  const copy = new Uint8Array(imageBytes);
  form.append("file", new Blob([copy], { type: "image/jpeg" }), "frame.jpg");

  const res = await fetch(url, { method: "POST", body: form });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Roboflow error: ${res.status} ${text}`);
  }

  return (await res.json()) as RoboflowResponse;
}
