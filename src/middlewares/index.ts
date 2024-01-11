import express from 'express';

let tokenHolder = '';

export const validateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers.authorization;
    // console.log(token);

    if (token) {
        const sessionToken = token.split(' ')[1];
        tokenHolder = sessionToken;
    }

    next();
};

export const isAuthenticated = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = tokenHolder;

    console.log("Middleware: ", token);

    if (!token || token.length === 0) {
        return res.status(408).json({ message: "Unauthorized: Token missing" });
    }
    
    next();
};