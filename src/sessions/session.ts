import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import { v4 } from 'uuid';

dotenv.config();

export const generateToken = () => {
  const token = jwt.sign(
    { session_id: v4()},
    process.env.TOKEN_KEY || "xxx",
    {
      expiresIn: "2h",
    }
  );
  return {
    token: token
  };
}