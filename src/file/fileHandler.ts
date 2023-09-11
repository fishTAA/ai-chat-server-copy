import { readPdf } from "./pdfHandler";
import fs from 'fs';


export const readDocumentFile = async (file: Express.Multer.File): Promise<string> => {
  let fileContents = "";
  const type = file.originalname.split(".").length > 1 ? file.originalname.split(".")[1] : "";
  console.log("type", type)
  if (type.toLowerCase() === 'pdf') {
    fileContents = await readPdf(file.path);
  } else {
    fileContents = fs.readFileSync(file.path, 'utf8'); 
  }
  return fileContents;
}