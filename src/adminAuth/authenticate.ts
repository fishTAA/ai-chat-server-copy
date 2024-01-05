import { title } from "process";
import { getConnection } from "../db/connection";

interface adminAcc{
    email?: string;
    name?: string;
    department?: string;
  }

export const findAdminAccs = async (email:string): Promise<boolean | null > => {
 
    return getConnection().then(async (db)=> {
      const c = await db.collection("adminAccounts").findOne({email})
      console.log(c)
      if(c!=null){
        return true;
      }
    }).catch((e)=> {
      console.log("error", e)
      return false;
    })
  
  }