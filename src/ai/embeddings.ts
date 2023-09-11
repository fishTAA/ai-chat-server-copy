import { getConnection } from "../db/connection";
import { Choice, CompletionDocument, DocumentUpload, EmbeddingData, RetProcess } from "./models";

const endPoint = process.env.AI_ENDPOINT || "";
const embeddingModel = process.env.EMBEDDING_MODEL || "";
const openAIToken = process.env.OPEN_AI_TOKEN || "";
const embeddingModelVersion = process.env.EMBEDDING_MODEL_VERSION || "";

export const createEmbedding = async (document: string): Promise<RetProcess> => {
  const embeddingData = await getEmbeddingData(document);
  const embedding = await storeEmbedding(document, embeddingData[0]);
  return  {
    objectId: embedding.id,
  }
}

export const getEmbeddingData = async (document: string) => {
  const embeddingEndPoint = `${endPoint}/${embeddingModel}/embeddings?api-version=${embeddingModelVersion}`;
  const data = {
    input: document,
  }
  return fetch(embeddingEndPoint, {
    method: "post",
    headers: {
      "api-key": openAIToken,
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
            input: 1,
            score: { $meta: 'searchScore' },
          },
        },
      ])
      .toArray()
    console.log("documents", documents)
    return documents;
  } catch (err) {
    throw err;
  }
}

export const storeEmbedding = async (input: string, embeddingData: EmbeddingData) => {
  return await getConnection().then(async (db)=> {
    const dateSend = new Date()
    const res = await db.collection("documentUpload").insertOne({
      input: input,
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

