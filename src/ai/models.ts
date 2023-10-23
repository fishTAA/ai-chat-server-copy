import { ObjectId } from "mongodb";

export interface Choice {
  index?: string;
  finish_reason?: string;
  message?: ChoiceMessage;
}

export interface ChoiceMessage {
  id?: string,
  role?: string;
  content?: string;
  title?: string;
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
  _id: string;
  input: string;
  solution?: string;
  title?: string;
  uploadDate: string;
  embedding: [Number];
  score?: number;
}

export interface RetProcess {
  objectId: ObjectId;
}