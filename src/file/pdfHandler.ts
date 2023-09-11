import fs from "fs";
import pdf from "pdf-parse";

export const readPdf = async (path: string): Promise<string> => {
  let data = "";
  const buffer = fs.readFileSync(path);
  const d = await pdf(buffer);
  return d.text;
}