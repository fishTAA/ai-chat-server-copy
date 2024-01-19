import express from 'express';
import { decodeToken } from '../sessions/session';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { findAdminAccs } from '../adminAuth/authenticate';

export const isAuthenticated = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers['authorization'];
    
    console.log("Middleware: ", token);

    if (!token || token.length === 0) {
        return res.status(408).json({ message: "Unauthorized: Token missing" });
    }
    
    next();
};

export const isAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers['authorization'];
    const sessionToken = token.split(' ')[1];
    try{
        const decodedToken:JwtPayload = jwt.decode(sessionToken, { complete: true });
        console.log(decodedToken.payload.unique_name)
        console.log(await findAdminAccs(decodedToken.payload.unique_name))
        if(await findAdminAccs(decodedToken.payload.unique_name)){
            console.log("User Verified, continuing")
            next()
        }else{
            console.log("User Unverified")
            return res.status(403).json({message: "Insufficient Privileges"})
        }
    }catch (error){
        return res.status(400).json(error)
    }
};