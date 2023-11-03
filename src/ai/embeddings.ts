import { getConnection } from "../db/connection";
import { Choice, CompletionDocument, DocumentUpload, EmbeddingData, RetProcess } from "./models";

const endPoint = process.env.AI_ENDPOINT || "";
const embeddingModel = process.env.EMBEDDING_MODEL || "";
const openAIToken = process.env.OPEN_AI_TOKEN || "";
const embeddingModelVersion = process.env.EMBEDDING_MODEL_VERSION || "";

export const createEmbedding = async (document: string, title: string, solution: string): Promise<RetProcess> => {
  const embeddingData = await getEmbeddingData(`title: "${title}" keyword:"${document}" answers/solutions:"${solution}"`);
  const embedding = await storeEmbedding(document, embeddingData[0], title, solution);
  return  {
    objectId: embedding.id,
  }
}

export const getEmbeddingData = async (documentKeyword: string) => {
  const embeddingEndPoint = `${endPoint}embeddings`;
  const data = {
    input: documentKeyword,
    "model": embeddingModel
    
  }
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
    const embeddingData: Array<EmbeddingData> = res.data;
    return embeddingData;
  }).catch((e)=> {
    console.log("error", e)
    throw e;
  });

}

export const findRelatedDocuments = async (embedding: [Number]): Promise<DocumentUpload[]> => {
  console.log("keyword", embedding)
  try {
    const conn = await getConnection();
    const collection = conn.collection<DocumentUpload>("documentUpload");
    const documents = await collection
      .aggregate<DocumentUpload>([
        {
          $search: {
            knnBeta: {
              vector: embedding,
              path: 'embedding',
              k: 5,
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
    const dateSend = new Date()
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

