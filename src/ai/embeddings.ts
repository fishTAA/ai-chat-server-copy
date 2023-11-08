import { getConnection } from "../db/connection";
import { Choice, CompletionDocument, DocumentUpload, EmbeddingData, RetProcess } from "./models";

const endPoint = process.env.AI_ENDPOINT || "";
const embeddingModel = process.env.EMBEDDING_MODEL || "";
const openAIToken = process.env.OPEN_AI_TOKEN || "";
const embeddingModelVersion = process.env.EMBEDDING_MODEL_VERSION || "";

export const createEmbedding = async (document: string, title: string, solution: string): Promise<RetProcess> => {
  // Retrieve embedding data based on the provided document, title, and solution.
  const embeddingData = await getEmbeddingData(`title: "${title}" keyword:"${document}" answers/solutions:"${solution}"`);

  // Store the obtained embedding data for the document.
  const embedding = await storeEmbedding(document, embeddingData[0], title, solution);
  
  // Return an object containing the objectId of the created embedding.
  return  {
    objectId: embedding.id,
  }
}

export const getEmbeddingData = async (documentKeyword: string) => {
  // Construct the endpoint URL for retrieving embedding data
  const embeddingEndPoint = `${endPoint}embeddings`;
  const data = {
    input: documentKeyword,
    "model": embeddingModel
  }

  // Make a POST request to the embedding endpoint with the provided data.
  return fetch(embeddingEndPoint, {
    method: "post",
    headers: {
     "Authorization":`Bearer ${openAIToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data)
  }).then((res)=> {
    return res.json()
  }).then(async (res)=> {
    // will return the embedding data from the response
    const embeddingData: Array<EmbeddingData> = res.data;
    return embeddingData;
  }).catch((e)=> {
    console.log("error", e)
    throw e;
  });

}

// A promise that resolves with an array of related documents
export const findRelatedDocuments = async (embedding: [Number]): Promise<DocumentUpload[]> => {
  console.log("keyword", embedding)
  try {
    // connection of the database
    const conn = await getConnection();

    // access the "documentUpload" collection (database)
    const collection = conn.collection<DocumentUpload>("documentUpload");

    // Use aggregation to find documents related to the provided embedding.
    const documents = await collection
      .aggregate<DocumentUpload>([
        {
          $search: {
            knnBeta: {
              vector: embedding,
              path: 'embedding',
              k: 5, // will get the top 5 related documents
            },
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            input: 1,
            solution: 1,
            score: { $meta: 'searchScore' },
          },
        },
      ])
      .toArray()
    return documents;
  } catch (err) {
    throw err;
  }
}

export const storeEmbedding = async (input: string, embeddingData: EmbeddingData, title: string, solution:string) => {
  return await getConnection().then(async (db)=> {
    // getting the current date and time
    const dateSend = new Date()

    // will be inserted to the db inside the "documentUpload" collection
    const res = await db.collection("documentUpload").insertOne({
      title: title,
      input: input,
      solution: solution,
      dateUploaded: new Date(),
      version: embeddingModelVersion,
      model: embeddingModel,
      embedding: embeddingData.embedding,
    });
    return {
      id: res.insertedId,
    }
  }).catch((e)=> {
    console.log("error", e)
    throw e;
  })
}

export const submitForm = async (name: string, email: string, ticketClassification: string, specificTopic: string, message: string, questionValue: string) => {
  return await getConnection().then(async (db)=> {
    // will be inserted to the db inside the "tickets" collection
    const res = await db.collection("tickets").insertOne({
      name: name,
      email: email,
      ticketClassification: ticketClassification,
      specificTopic: specificTopic,
      message: message,
      questionValue: questionValue
    });
    return {
      id: res.insertedId,
    }
  }).catch((e)=> {
    console.log("error", e)
    throw e;
  })
}

