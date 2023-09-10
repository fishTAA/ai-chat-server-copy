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
      expiresIn: "2h",
    }
  );
  return {
    token: token,
    sessionId: sessionId,
  };
}

export const decodeToken = (token): Token => {
  if (token) {
    const t = jwt.verify(token.toString(), TOKEN_KEY);
    return JSON.parse(JSON.stringify(t));
  } else {
    return {
      session_id: "",
      iat: 0,
      exp: 0,
    };
  }
}