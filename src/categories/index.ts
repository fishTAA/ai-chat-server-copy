import { ObjectId } from 'mongodb';
import { getConnection } from '../db/connection';
import { categoriesModel } from './models';

export const findCategory= async (_id: string): Promise<categoriesModel | null > => {
  return getConnection().then(async (db)=> {
    // Find a document in the "documentUpload" collection by its unique identifier.
    const c = db.collection<categoriesModel>("embeddingCategories").findOne(new ObjectId(_id))
    return c;
  }).catch((e)=> {
    console.log("error", e)
    return null;
  })
}