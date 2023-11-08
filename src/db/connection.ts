import { Db, MongoClient } from "mongodb";

const connectionString = process.env.ATLAS_URI || "";


const client = new MongoClient(connectionString);
  
// Asynchronously establishes a connection to the database using the provided client and stores the connection in 'conn'.
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
  // Check if a database connection already exists. If no connection exist, establish a new connection using the 'makeConnection' function.
  if (!conn) {
    await makeConnection();
  }

  // Retrieve the database connection for the specified database name, in this case, "IT-Support."
  const dbConnection: Db = conn.db("IT-Support");

  // Return the established database connection.
  return dbConnection;
}