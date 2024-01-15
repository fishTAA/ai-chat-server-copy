import { Categories } from "./models";
import { getConnection } from "./connection";

export const createCategories = async(categoriesData:Categories)=>{
    return await getConnection().then(async (db)=>{

      const res = await db.collection("embeddingCategories").insertOne(categoriesData);

      return {
        id: res.insertedId}
      }).catch((e)=> {
        console.log("error", e)
        throw e;
    })
}