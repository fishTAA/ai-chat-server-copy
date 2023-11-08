import { ObjectId } from "mongodb";
import { getConnection } from "../db/connection";
import { SettingsInterface } from "./models";

export const saveSettings = async (settingsData: SettingsInterface) => {
  return await getConnection().then(async (db)=> {
    const dateSend = new Date()

    // Update the settings in the "settings" collection in the database.
    const res = await db.collection("settings").updateOne(
      {}
      ,
      {
        $set: {
          enableEmbedding: settingsData.enableEmbedding,
          minimumScore: settingsData.minimumScore,
        }
      });

    // Return an object containing the result of the database update.
    return {
      id: res.upsertedId,
    }
  }).catch((e)=> {
    console.log("error", e)
    throw e;
  })
}

export const getSettings = async () => {
  return await getConnection().then(async (db)=> {
    const dateSend = new Date()

    // Find and retrieve the application settings from the "settings" collection in the database.
    const res = await db.collection<SettingsInterface>("settings").findOne<SettingsInterface>({});
    
    // Return the retrieved settings or null if not found.
    return res;
  }).catch((e)=> {
    console.log("error", e)
    throw e;
  })
}
