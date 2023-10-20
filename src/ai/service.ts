import { getConnection } from "../db/connection";
import { getSettings } from "../settings/settings";
import { findRelatedDocuments, getEmbeddingData } from "./embeddings";
import { Choice, CompletionDocument } from "./models";

const endPoint = process.env.AI_ENDPOINT || "";
const completionModel = process.env.COMPLETION_MODEL || "";
const openAIToken = process.env.OPEN_AI_TOKEN || "";
const completionModelVersion = process.env.COMPLETION_MODEL_VERSION || "";

export const predictCompletion = async (prompt: string): Promise<Array<Choice>> => {
  const choice = await findPrompt(prompt);
  if (choice) {
   return choice;
  }

  const settings = await getSettings();
  const choices: Array<Choice> = [];
  let query = prompt;
  if (true) {
    const promptEmbed = await getEmbeddingData(prompt);
    console.log("embed>", promptEmbed?.length)
    if (promptEmbed && promptEmbed.length > 0) {
      const related = await findRelatedDocuments(promptEmbed[0].embedding);
      console.log("related", related?.length)
      if (related && related.length > 0) {
        related.map((doc)=> {
          const selectedRelated = related[0]
          const score : number = 100 * (selectedRelated.score || 100);
          if(score >= settings.minimumScore) {
            const newChoice: Choice = {
              index: "",
              finish_reason: "",
              message: {
                content: doc.solution,
                title: doc.title
              },
            };
            choices.push(newChoice);
          } else {
            const newChoice: Choice = {
              index: "",
              finish_reason: "",
              message: {
                content: "I could not find any related solution to your query.",
                title: doc.title
              },
            };
            choices.push(newChoice);

          }
        })
      }
    }
    // storePrompt(prompt, choices);
    // return choices;
  }

  storePrompt(prompt, choices);
  return choices;
}

export const findPrompt = async (prompt: string): Promise<Array<Choice> | null> => {
  return await getConnection().then(async (db)=> {
    const dateSend = new Date()
    
    const c = db.collection<CompletionDocument>("completion").findOne<CompletionDocument>({
      prompt: {
        $eq: prompt?.toLowerCase(),
      },
      model: {
        $eq: completionModel,
      },
      version: {
        $eq: completionModelVersion,
      },
    })
    const completionDocuments = await c;
    if (completionDocuments) {
      return completionDocuments.choices;
    } else {
      return null;
    }
  }).catch((e)=> {
    console.log("error", e)
    throw e;
  })
}

export const storePrompt = async (prompt: string, choices: Array<Choice>) => {
  return await getConnection().then(async (db)=> {
    const dateSend = new Date()
    const res = await db.collection("completion").insertOne({
      prompt: prompt,
      model: completionModel,
      version: completionModelVersion,
      choices: choices
    });
    return {
      id: res.insertedId,
      dateSent: dateSend,
    }
  }).catch((e)=> {
    console.log("error", e)
    throw e;
  })
}