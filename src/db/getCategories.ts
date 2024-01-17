import { Categories } from "./models";
import { getConnection } from "./connection";
import { ObjectId } from "mongodb";

export const getCategories = async () => {
  return getConnection().then(async (db) => {
    const Categories = await db.collection("embeddingCategories").find({});
    const resCategories = await Categories.toArray();
    return resCategories;
  });
};
//db function to retrieve emebeddings with certatain category
export const filterEmbeddingsbyCategory = async (c) => {
  try {
    return getConnection().then(async (db) => {
      const data = await db
        .collection("documentUpload")
        .find({ categories: c });
      const embedding = await data.toArray();
      console.log("array", embedding);
      return embedding;
    });
  } catch (e) {
    console.error("Error fetching settings:", e);
  }
};
