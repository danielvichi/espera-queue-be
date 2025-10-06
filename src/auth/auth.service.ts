import { Injectable } from '@nestjs/common';
import { AdminResponseDto } from 'src/admin/admin.dto';
import { AdminService } from 'src/admin/admin.service';
import {
  defaultAuthExceptionMessage,
  InvalidCredentialsException,
} from './auth.exceptions';

interface AdminSignIn {
  email: string;
  passwordHash: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly adminService: AdminService) {}

  async adminSignIn(data: AdminSignIn): Promise<AdminResponseDto | null> {
    const adminUser = await this.adminService.findAdminByEmail(data.email);

    if (!adminUser) {
      return null;
    }

    const { passwordHash, ...adminDataWithoutPassword } = adminUser;
    if (data.passwordHash !== passwordHash) {
      throw new InvalidCredentialsException(
        defaultAuthExceptionMessage.INVALID_CREDENTIALS,
      );
    }

    return adminDataWithoutPassword;
  }
}
