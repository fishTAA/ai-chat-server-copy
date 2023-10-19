import { Db, MongoClient } from "mongodb";

const connectionString = process.env.ATLAS_URI || "";


const client = new MongoClient(connectionString);
  
let conn: MongoClient;
const makeConnection = async () => {
  try {
    await client.connect().then(con => conn = con);
    console.log("Connected to DB")
  } catch(e) {
    console.error(e);
  }  

}


export const getConnection = async (): Promise<Db> => {
  if (!conn) {
    await makeConnection();
  }
  const dbConnection: Db = conn.db("IT-Support");
  return dbConnection;
}