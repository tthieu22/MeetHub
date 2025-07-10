// src/types/express.d.ts

import { UserPayload } from '@api/auth/interfaces/user-payload.interface';

declare module 'express' {
  interface Request {
    user?: UserPayload;
  }
}
