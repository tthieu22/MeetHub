// src/auth/interfaces/user-payload.interface.ts

import { UserRole } from '../../modules/users/schema/user.schema';

export interface UserPayload {
  _id: string;
  email: string;
  avatarURL: string;
  role: UserRole;
}
