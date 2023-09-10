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