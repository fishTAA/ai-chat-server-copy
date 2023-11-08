import { getConnection } from "../db/connection";
import { getSettings } from "../settings/settings";
import { findRelatedDocuments, getEmbeddingData } from "./embeddings";
import { Choice, CompletionDocument } from "./models";

const endPoint = process.env.AI_ENDPOINT || "";
const completionModel = process.env.COMPLETION_MODEL || "";
const openAIToken = process.env.OPEN_AI_TOKEN || "";
const completionModelVersion = process.env.COMPLETION_MODEL_VERSION || "";

export const predictCompletion = async (prompt: string): Promise<Array<Choice>> => {
  // check if a matching prompt is stored in the database. if the choice is true, return its associated choices
  const choice = await findPrompt(prompt);
  if (choice) {
   return choice;
  }

  const settings = await getSettings();
  const choices: Array<Choice> = [];
  let query = prompt;

  // Check if prompt embedding retrieval is enabled.
  if (true) {
    const promptEmbed = await getEmbeddingData(prompt);
    console.log("embed>", promptEmbed?.length)

    // Check if embedding data is available and related documents can be retrieved.
    if (promptEmbed && promptEmbed.length > 0) {
      // Find related documents based on the embedding of the prompt.
      const related = await findRelatedDocuments(promptEmbed[0].embedding);
      console.log("related", related?.length)

      if (related && related.length > 0) {
        // Iterate through related documents and create choices based on their content.
        related.map((doc)=> {
          const selectedRelated = related[0]
          const score : number = 100 * (selectedRelated.score || 100);

          // Check if the score exceeds the minimum score defined in settings.
          if(score >= settings.minimumScore) {
            const newChoice: Choice = {
              index: "",
              finish_reason: "",
              message: {
                content: doc.solution,
                title: doc.title,
                id: doc._id,
               
              },
            };
            choices.push(newChoice);
          } else {
            // If the score is below the minimum, create a choice indicating no relevant solution was found.
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

  // store in the database
  storePrompt(prompt, choices);
  return choices;
}

export const findPrompt = async (prompt: string): Promise<Array<Choice> | null> => {
  return await getConnection().then(async (db)=> {
    const dateSend = new Date()
    // Find a completion document in the "completion" collection that matches the provided prompt, model, and version.
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

    // If a matching completion document is found, return its associated choices else return null
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
    // getting the current date
    const dateSend = new Date()

    // will be inserted to the db inside the "completion" collection
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