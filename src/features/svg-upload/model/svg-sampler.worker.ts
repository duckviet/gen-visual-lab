import { sampleSvgPoints } from "@/shared/lib/path-sampling";

type RequestMessage = {
  source: string;
  samplePoints: number;
};

self.onmessage = async (event: MessageEvent<RequestMessage>) => {
  try {
    const points = await sampleSvgPoints(event.data.source, event.data.samplePoints, "outline");
    self.postMessage({ points });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "SVG sampling failed" });
  }
};
