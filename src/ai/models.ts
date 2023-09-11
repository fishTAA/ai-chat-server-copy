import { ObjectId } from "mongodb";

export interface Choice {
  index?: string;
  finish_reason?: string;
  message?: ChoiceMessage;
}

export interface ChoiceMessage {
  role?: string;
  content?: string;
}

export interface CompletionDocument {
  _id: string;
  prompt: string;
  choices: Array<Choice>;
  model: string;
  version: string;
}

export interface EmbeddingData {
  object: string;
  embedding: [Number];
  index: number
}

export interface DocumentUpload {
  input: string;
  uploadDate: string;
  embedding: [Number];
  score?: number;
}

export interface RetProcess {
  objectId: ObjectId;
}