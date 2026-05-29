import type { Request, Response, NextFunction } from 'express';
import { verifyFirebaseIdToken } from '../auth/firebase';

export type AuthContext = {
  uid: string;
  phoneNumber?: string;
  email?: string;
  name?: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __dishaAuthTypes: unknown;
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthContext;
  }
}

export function requireAuthIfEnabled(req: Request, res: Response, next: NextFunction) {
  const enabled = process.env.ENABLE_SERVER_AUTH === 'true';
  if (!enabled) {
    return next();
  }

  const header = req.header('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ error: 'Missing Authorization bearer token' });
  }

  verifyFirebaseIdToken(match[1])
    .then((user) => {
      req.auth = user;
      next();
    })
    .catch((error) => {
      console.warn('[auth] token verification failed', error);
      res.status(401).json({ error: 'Invalid token' });
    });
}

