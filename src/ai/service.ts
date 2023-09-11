import { getConnection } from "../db/connection";
import { getSettings } from "../settings/settings";
import { findRelatedDocuments, getEmbeddingData } from "./embeddings";
import { Choice, CompletionDocument } from "./models";

const endPoint = process.env.AI_ENDPOINT || "";
const completionModel = process.env.COMPLETION_MODEL || "";
const openAIToken = process.env.OPEN_AI_TOKEN || "";
const completionModelVersion = process.env.COMPLETION_MODEL_VERSION || "";

export const predictCompletion = async (prompt: string): Promise<Choice> => {
  const choice = await findPrompt(prompt);
  if (choice) {
    return choice[0];
  }

  const settings = await getSettings();

  let query = prompt;
  if (settings.enableEmbedding) {
    const promptEmbed = await getEmbeddingData(prompt);
    if (promptEmbed && promptEmbed.length > 0) {
      const related = await findRelatedDocuments(promptEmbed[0].embedding);
      if (related && related.length > 0) {
        const selectedRelated = related[0]
        const score : number = 100 * (selectedRelated.score || 100);
        if(score >= settings.minimumScore) {
          // inspired by https://gist.github.com/toshvelaga/2bd8b5efb14c145892a14bcb663c7342
          query = `Based on this context: ${selectedRelated.input} \n\n Query: ${prompt} \n\n Answer:`
        }
      }
    }
  }
  console.log("query", query);

  const completionEndPoint = `${endPoint}/${completionModel}/chat/completions?api-version=${completionModelVersion}`;
  const data = {
    "messages": [{
      role: "user",
      content: query,
    }]
  }
  return fetch(completionEndPoint, {
    method: "post",
    headers: {
      "api-key": openAIToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data)
  }).then((res)=> {
    return res.json()
  }).then((res)=> {
    const choices: Array<Choice> = res.choices;
    storePrompt(prompt, choices);
    return choices[0];
  }).catch((e)=> {
    console.log("error", e)
    return {
      message: {}
    }
  });
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