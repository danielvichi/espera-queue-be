import { AdminRole } from '@prisma/client';

export class AdminDto {
  id: string;
  role: AdminRole;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  clientId?: string | null | undefined;
  unityIds?: string[];
  queueIds?: string[];
  enabled: boolean;
}

export class CreatedAdminDto {
  role: AdminRole;
  name: string;
  email: string;
  passwordHash: string;
  clientId?: string;
  unityIds?: string[];
  queueIds?: string[];
}
