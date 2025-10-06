import { Injectable } from '@nestjs/common';
import { AdminDto, CreatedAdminDto } from './admin.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminRole } from '@prisma/client';
import {
  CreateAdminBadRequestException,
  createAdminBadRequestExceptionMessages,
} from './admin.exceptions';
import {
  checkCreateAdminRequirementsOrThrowError,
  checkRoleRequirementsOrThrowError,
} from './admin.utils';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async findAdminByEmail(email: string): Promise<AdminDto | null> {
    const admin = await this.prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return null;
    }

    return admin;
  }

  async createAdmin(data: CreatedAdminDto): Promise<AdminDto> {
    // Role-based validations
    checkCreateAdminRequirementsOrThrowError(data);

    // Role-specific validations
    checkRoleRequirementsOrThrowError(data);

    // Check if client already has an owner
    if (data.role === AdminRole.CLIENT_OWNER) {
      const alreadyHasOwner = await this.prisma.admin.findFirst({
        where: {
          role: AdminRole.CLIENT_OWNER,
          clientId: data.clientId,
        },
      });

      if (alreadyHasOwner) {
        throw new CreateAdminBadRequestException(
          createAdminBadRequestExceptionMessages.OWNER_ALREADY_EXISTS,
        );
      }
    }

    const responseAdmin = await this.prisma.admin.create({
      data: {
        ...data,
        clientId: data.clientId ?? undefined,
        unityIds: data.unityIds ?? [],
        queueIds: data.queueIds ?? [],
        enabled: true,
      },
    });

    const formattedResponse: AdminDto = {
      ...responseAdmin,
      enabled: responseAdmin.enabled || true,
    };

    return formattedResponse;
  }
}
