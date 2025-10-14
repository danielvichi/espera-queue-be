import { Injectable } from '@nestjs/common';
import { AdminDto, CreatedAdminDto, CreateOwnerAdminDto } from './admin.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminRole } from '@prisma/client';
import {
  AdminNotFoundException,
  createAdminBadRequestExceptionMessages,
  CreateAdminConflictException,
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

    // Check if admin with email already exists
    if (data.role === AdminRole.CLIENT_OWNER) {
      throw new Error(createAdminBadRequestExceptionMessages.ROLE_NOT_ALLOWED);
    }

    const accountWithEmail = await this.prisma.admin.findFirst({
      where: {
        email: data.email,
      },
    });

    if (accountWithEmail) {
      throw new CreateAdminConflictException(
        createAdminBadRequestExceptionMessages.EMAIL_ALREADY_TAKEN,
      );
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

  async createOwnerAdmin(data: CreateOwnerAdminDto): Promise<AdminDto> {
    const createAdminData = {
      ...data,
      role: AdminRole.CLIENT_OWNER,
    };

    // Role-based validations
    checkCreateAdminRequirementsOrThrowError(createAdminData);

    const existingAccount = await this.findAdminByEmail(data.email);

    if (existingAccount) {
      throw new CreateAdminConflictException(
        createAdminBadRequestExceptionMessages.OWNER_ALREADY_EXISTS,
      );
    }

    const responseOwnerAdmin = await this.prisma.admin.create({
      data: { ...createAdminData },
    });

    const formattedResponse: AdminDto = {
      ...responseOwnerAdmin,
      enabled: responseOwnerAdmin.enabled || true,
    };

    return formattedResponse;
  }

  async deleteAdmin(email: string): Promise<Partial<AdminDto>> {
    const admin = await this.prisma.admin.findFirst({
      where: {
        email: email,
      },
    });

    if (!admin) {
      throw new AdminNotFoundException(email);
    }

    const deleteResponse = await this.prisma.admin.delete({
      where: {
        email: admin.email,
      },
    });

    return deleteResponse;
  }

  // TODO: TESTS FOR:
  // async updateAdmin(data: Partial<AdminDto>): Promise<AdminDto> {
  //   const admin = await this.prisma.admin.findFirstOrThrow({
  //     where: { OR: [{ email: data.email }, { id: data.id }] },
  //   });

  //   const updatedAdmin = await this.prisma.admin.update({
  //     where: {
  //       id: admin.id,
  //     },
  //     data: {
  //       ...data,
  //     },
  //   });

  //   return updatedAdmin;
  // }
}
