import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import { v4 } from 'uuid';

dotenv.config();

export const TOKEN_KEY = process.env.TOKEN_KEY || "xxx";

interface Token {
  session_id: string;
  iat: number;
  exp: number;
}

export const generateToken = () => {
  const sessionId = v4();
  const token = jwt.sign(
    { session_id: sessionId},
    TOKEN_KEY,
    {
      expiresIn: "12h",
    }
  );
  return {
    token: token,
    sessionId: sessionId,
  };
}

export const decodeToken = (token): Token => {
  try {
    if (token) {
      // Verify and decode the JWT using the provided TOKEN_KEY.
      console.log("Decoding token")
      const t = jwt.verify(token.toString(), TOKEN_KEY);
      return JSON.parse(JSON.stringify(t));
    } else {
      // Return an object with default values if no token is provided.
      return {
        session_id: "",
        iat: 0,
        exp: 0,
      };
    }
  } catch(e){
    console.log("e", e);
  }
}