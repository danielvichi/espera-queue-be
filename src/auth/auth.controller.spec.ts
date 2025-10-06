import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { AuthController } from './auth.controller';
import { AdminResponseDto, CreatedAdminDto } from 'src/admin/admin.dto';
import { AdminService } from 'src/admin/admin.service';
import { AdminRole } from 'generated/prisma';
import {
  defaultAuthExceptionMessage,
  InvalidCredentialsException,
} from './auth.exceptions';
import { JwtService } from '@nestjs/jwt';

const ADMIN_MOCK_DATA: CreatedAdminDto = {
  name: 'Admin Name',
  email: 'admin@email.com',
  passwordHash: 'password_hash',
  role: AdminRole.QUEUE_ADMIN,
  queueIds: ['1'],
};

describe('AuthController', () => {
  let authController: AuthController;
  let adminService: AdminService;
  let jwtService: JwtService;
  let adminUser: AdminResponseDto;
  const loginData = ADMIN_MOCK_DATA;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    authController = module.get<AuthController>(AuthController);
    jwtService = module.get<JwtService>(JwtService);
    adminService = module.get<AdminService>(AdminService);

    await TestModuleSingleton.cleanUpDatabase();

    adminUser = await adminService.createAdmin(ADMIN_MOCK_DATA);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  it('should NOT be able to signin with missing email', async () => {
    await expect(
      authController.adminSignIn({
        email: '',
        passwordHash: loginData.passwordHash,
      }),
    ).rejects.toThrow(
      new InvalidCredentialsException(
        defaultAuthExceptionMessage.INVALID_CREDENTIALS,
      ),
    );
  });

  it('should NOT be able to signin with missing hashed password', async () => {
    await expect(
      authController.adminSignIn({
        email: loginData.email,
        passwordHash: '',
      }),
    ).rejects.toThrow(
      new InvalidCredentialsException(
        defaultAuthExceptionMessage.PASSWORD_REQUIRED,
      ),
    );
  });

  it('should be get a JWT on signin with proper credentials', async () => {
    const userToken = await authController.adminSignIn({
      email: loginData.email,
      passwordHash: loginData.passwordHash,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const decodedUserToken = jwtService.decode(userToken.access_token);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const decodedUserData: AdminResponseDto = decodedUserToken.user;

    expect(decodedUserData.id).toBe(adminUser.id);
    expect(decodedUserData.email).toBe(adminUser.email);
  });
});
