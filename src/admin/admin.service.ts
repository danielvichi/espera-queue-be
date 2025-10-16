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

  /**
   * Finds and returns Admin data by its email
   *
   * @param {string} email - User email string
   * @returns {Promise<AdminDto | null>} Returns user object or null if user does not exist
   */
  async findAdminByEmail(email: string): Promise<AdminDto | null> {
    const admin = await this.prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return null;
    }

    return admin;
  }

  /**
   * Creates and return a Nom OWNER Admin Account
   *
   * @param {CreatedAdminDto}data - Admin data
   * @returns {Promise<AdminDto>} Returns admin data if its succeed to create admin
   */
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

  /**
   * Creates and return a OWNER Admin Account
   *
   * @param {CreateOwnerAdminDto}data - Admin data
   * @returns {Promise<AdminDto>} Returns admin data if its succeed to create admin
   */
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

  /**
   * Deletes permanently a Admin - Warning its a irreversible action
   *
   * @param {string}email - Admin's email
   * @returns {Promise<AdminDto>} Returns deleted admin data
   */
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
