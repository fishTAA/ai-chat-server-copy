import { ObjectId } from "mongodb";
import { getConnection } from "../db/connection";
import { SettingsInterface } from "./models";

export const saveSettings = async (settingsData: SettingsInterface) => {
  return await getConnection().then(async (db)=> {
    const dateSend = new Date()
    const res = await db.collection("settings").updateOne(
      {}
      ,
      {
        $set: {
          enableEmbedding: settingsData.enableEmbedding,
          minimumScore: settingsData.minimumScore,
        }
      });
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
    const res = await db.collection<SettingsInterface>("settings").findOne<SettingsInterface>({});
    return res;
  }).catch((e)=> {
    console.log("error", e)
    throw e;
  })
}
