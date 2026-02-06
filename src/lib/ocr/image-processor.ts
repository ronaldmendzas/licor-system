import { createWorker } from "tesseract.js";

export async function extractTextFromImage(imageSource: string): Promise<string[]> {
  const worker = await createWorker("spa");
  const { data } = await worker.recognize(imageSource);
  await worker.terminate();

  return data.text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 2);
}
