import { ObjectId } from "mongodb";
import { getConnection } from "../db/connection";
import {
  Choice,
  CompletionDocument,
  DocumentUpload,
  EmbeddingData,
  RetProcess,
} from "./models";

const endPoint = process.env.AI_ENDPOINT || "";
const embeddingModel = process.env.EMBEDDING_MODEL || "";
const openAIToken = process.env.OPEN_AI_TOKEN || "";
const embeddingModelVersion = process.env.EMBEDDING_MODEL_VERSION || "";

export const createEmbedding = async (
  document: string,
  title: string,
  solution: string,
  categories: string[]
): Promise<RetProcess> => {
  // Check if the solution is HTML
  const isHtml = isHtmlContent(solution);

  // Retrieve embedding data based on the provided document, title, and solution.
  let embeddingData: Array<EmbeddingData> = [];
  if (!isHtml) {
    console.log("NON-HTML");
    embeddingData = await getEmbeddingData(
      `title: "${title}" keyword:"${document}" answers/solutions:"${solution}" categories:${categories}`
    );
  } else {
    console.log("HTML");
    embeddingData = await getEmbeddingData(
      `title: "${title}" keyword:"${document}" categories:${categories}`
    );
  }
  console.log("Attemptng to Save", embeddingData);
  // Store the obtained embedding data for the document.
  const embedding = await storeEmbedding(
    document,
    embeddingData[0],
    title,
    solution,
    categories
  );

  // Return an object containing the objectId of the created embedding.
  return {
    objectId: embedding.id,
  };
};

// Function to check if content is HTML
const isHtmlContent = (content: string): boolean => {
  const htmlRegex = /<\/?[a-z][\s\S]*>/i;
  return htmlRegex.test(content);
};

export const getEmbeddingData = async (documentKeyword: string) => {
  // Construct the endpoint URL for retrieving embedding data
  const embeddingEndPoint = `${endPoint}embeddings`;
  const data = {
    input: documentKeyword,
    model: embeddingModel,
  };
  console.log("Getembeddingdata openaikey:", openAIToken);
  // Make a POST request to the embedding endpoint with the provided data.
  return fetch(embeddingEndPoint, {
    method: "post",
    headers: {
      Authorization: `Bearer ${openAIToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((res) => {
      return res.json();
    })
    .then(async (res) => {
      // will return the embedding data from the response
      const embeddingData: Array<EmbeddingData> = res.data;
      return embeddingData;
    })
    .catch((e) => {
      console.log("error", e);
      throw e;
    });
};

export const updateExistingEmbedding = async (
  document: string,
  title: string,
  keyword: string,
  categories: string[],
  findID: ObjectId
): Promise<any> => {
  // Check if the solution is HTML
  const isHtml = isHtmlContent(document);

  // Retrieve embedding data based on the provided document, title, and solution.
  let embeddingData: Array<EmbeddingData> = [];
  if (!isHtml) {
    console.log("NON-HTML");
    embeddingData = await getEmbeddingData(
      `title: "${title}" keyword:"${keyword}" answers/solutions:"${document}" categories:${categories}`
    );
  } else {
    console.log("HTML");
    embeddingData = await getEmbeddingData(
      `title: "${title}" keyword:"${keyword}" categories:${categories}`
    );
  }
  try {
    const findResult = await getConnection().then(async (db) => {
      return await db.collection("documentUpload").updateOne(
        {
          _id: findID,
        },
        {
          $set: {
            title: title,
            input: keyword,
            solution: document,
            categories: categories,
            dateUploaded: new Date(),
            version: embeddingModelVersion,
            model: embeddingModel,
            embedding: embeddingData[0].embedding,
          },
        }
      );
    });
  } catch (error) {
    console.log("Error Updating", error);
    return { error: error.message || "Update failed" };
  }
  // Return an object containing the objectId of the updated embedding.
  return {
    objectId: findID,
  };
};

// A promise that resolves with an array of related documents
export const findRelatedDocuments = async (
  embedding: [Number]
): Promise<DocumentUpload[]> => {
  console.log("keyword", embedding);
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
              path: "embedding",
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
            score: { $meta: "searchScore" },
          },
        },
      ])
      .toArray();
    return documents;
  } catch (err) {
    throw err;
  }
};

export const storeEmbedding = async (
  input: string,
  embeddingData: EmbeddingData,
  title: string,
  solution: string,
  categories: string[]
) => {
  return await getConnection()
    .then(async (db) => {
      // getting the current date and time
      const dateSend = new Date();

      // will be inserted to the db inside the "documentUpload" collection
      const res = await db.collection("documentUpload").insertOne({
        title: title,
        input: input,
        solution: solution,
        categories: categories,
        dateUploaded: new Date(),
        version: embeddingModelVersion,
        model: embeddingModel,
        embedding: embeddingData.embedding,
      });
      return {
        id: res.insertedId,
      };
    })
    .catch((e) => {
      console.log("error", e);
      throw e;
    });
};

export const submitForm = async (
  name: string,
  email: string,
  ticketClassification: string,
  specificTopic: string,
  message: string,
  questionValue: string
) => {
  return await getConnection()
    .then(async (db) => {
      // will be inserted to the db inside the "tickets" collection
      const res = await db.collection("tickets").insertOne({
        name: name,
        email: email,
        ticketClassification: ticketClassification,
        specificTopic: specificTopic,
        message: message,
        questionValue: questionValue,
      });
      return {
        id: res.insertedId,
      };
    })
    .catch((e) => {
      console.log("error", e);
      throw e;
    });
};

export const getEmbeddingCollection = async (req, res) => {
  try {
    const db = await getConnection();

    const articleC = await db.collection("documentUpload").find({});
    const articles = await articleC.toArray();

    res.status(200).send(articles);
  } catch (error) {
    console.error("Error in getEmbeddingCollection:", error);
    res.status(500).send("Internal Server Error");
  }
};
