import { Db, MongoClient } from "mongodb";

const connectionString = process.env.ATLAS_URI || "";

export const getConnection = async (): Promise<Db> => {
  const client = new MongoClient(connectionString);
  
  let conn: MongoClient;
  try {
    conn = await client.connect();
  } catch(e) {
    console.error(e);
  }
  
  const dbConnection: Db = conn.db("ai-chat");
  return dbConnection;
}