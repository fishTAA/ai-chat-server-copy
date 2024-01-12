import { Categories } from "./models";
import { getConnection } from "../db/connection";

export const getCategories = async () => {
  return getConnection().then(async (db) => {
    const Categories = await db.collection("embeddingCategories").find({});
    const resCategories = await Categories.toArray();
    return resCategories;
  });
};
