import express from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

import { get, merge} from 'lodash';

import { ValidateToken } from '../adminAuth/validatetoken';

export const isAuthenticated = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers.authorization;
    console.log(token);
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: Token missing" });
    }
    const splittoken = token.split(" ")[1];
    // console.log("test token:" + splittoken);

    const t = jwt.decode(splittoken, { complete: true });
    const value = ValidateToken(t);
    // console.log(t.header.kid);
    next();

    // if (value) {
    //     res.json(true);
    // } else {
    //     res.json(false);
    // };

};