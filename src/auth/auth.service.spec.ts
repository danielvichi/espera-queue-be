import { AuthService } from './auth.service';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { AdminService } from 'src/admin/admin.service';
import { AdminResponseDto, CreatedAdminDto } from 'src/admin/admin.dto';
import { AdminRole } from '@prisma/client';
import {
  defaultAuthExceptionMessage,
  InvalidCredentialsException,
} from './auth.exceptions';

const ADMIN_MOCK_DATA: CreatedAdminDto = {
  name: 'Admin Name',
  email: 'admin@email.com',
  passwordHash: 'password_hash',
  role: AdminRole.QUEUE_ADMIN,
  queueIds: ['1'],
};

describe('AuthService', () => {
  let authService: AuthService;
  let adminService: AdminService;
  let adminUser: AdminResponseDto;
  const loginData = ADMIN_MOCK_DATA;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    authService = module.get<AuthService>(AuthService);
    adminService = module.get<AdminService>(AdminService);

    await TestModuleSingleton.cleanUpDatabase();

    adminUser = await adminService.createAdmin(ADMIN_MOCK_DATA);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('should be able to signin with a valid email', async () => {
    const signedUser = await authService.adminSignIn({
      email: loginData.email,
      passwordHash: loginData.passwordHash,
    });

    expect(signedUser?.clientId).toBeDefined();
    expect(signedUser?.email).toBe(adminUser.email);
  });

  it('should NOT be able to signin with a miss matched password', async () => {
    await expect(
      authService.adminSignIn({
        email: loginData.email,
        passwordHash: 'miss_matched_password',
      }),
    ).rejects.toThrow(
      new InvalidCredentialsException(
        defaultAuthExceptionMessage.INVALID_CREDENTIALS,
      ),
    );
  });

  it('should return NULL if the valid email does NOT belong to an Admin account', async () => {
    const signinResult = await authService.adminSignIn({
      email: 'never_registered_email@email.com',
      passwordHash: loginData.email,
    });

    expect(signinResult).toBeNull();
  });
});
