// express.d.ts
import express from 'express';

declare module 'express-serve-static-core' {
    interface Request {
        sessionToken?: string;
    }
}
