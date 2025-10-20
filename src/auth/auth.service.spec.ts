import { AuthService } from './auth.service';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { AdminService } from 'src/admin/admin.service';
import { AdminResponseDto, CreatedAdminDto } from 'src/admin/admin.dto';
import { AdminRole } from '@prisma/client';
import {
  defaultAuthExceptionMessage,
  InvalidCredentialsException,
} from './auth.exceptions';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedRequestDto } from './auth.dto';
import { COOKIE_MAX_AGE_IN_MS } from 'src/constants/config';
import { ClientDto } from 'src/client/client.dto';

const ADMIN_MOCK_DATA: CreatedAdminDto = {
  name: 'Admin Name',
  email: 'admin@email.com',
  passwordHash: 'password_hash',
  role: AdminRole.QUEUE_ADMIN,
  queueIds: ['1'],
};

const CLIENT_MOCK_DATA: ClientDto = {
  id: 'some_id',
  name: 'Client Serv A',
  address: 'Client address in the client format.',
  phone: '+1-234-567-8900',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let authService: AuthService;
  let adminService: AdminService;
  let adminUser: AdminResponseDto;
  let jwtService: JwtService;
  const loginData = ADMIN_MOCK_DATA;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    authService = module.get<AuthService>(AuthService);
    adminService = module.get<AdminService>(AdminService);
    jwtService = module.get<JwtService>(JwtService);

    await TestModuleSingleton.cleanUpDatabase();

    adminUser = await adminService.createAdmin(ADMIN_MOCK_DATA);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });
  describe('AuthService', () => {
    it('should be able to signin with a valid email', async () => {
      const signedUser = await authService.checkAdminCredentials({
        email: loginData.email,
        passwordHash: loginData.passwordHash,
      });

      expect(signedUser?.clientId).toBeDefined();
      expect(signedUser?.email).toBe(adminUser.email);
    });

    it('should NOT be able to signin with a miss matched password', async () => {
      await expect(
        authService.checkAdminCredentials({
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
      const signinResult = await authService.checkAdminCredentials({
        email: 'never_registered_email@email.com',
        passwordHash: loginData.email,
      });

      expect(signinResult).toBeNull();
    });
  });

  describe('Generate JWT', () => {
    it('should be able to generate a Jwt with user data', async () => {
      const mock_request_with_user_data = adminUser;

      const signedJwtToken = await authService.generateJwtForUser({
        ...mock_request_with_user_data,
        client: CLIENT_MOCK_DATA,
      });

      expect(signedJwtToken).toBeDefined();

      const decodedJwtToken: string = await jwtService.decode(signedJwtToken);
      expect(decodedJwtToken).toMatchObject({
        ...mock_request_with_user_data,
        createdAt: mock_request_with_user_data.createdAt.toISOString(),
        updatedAt: mock_request_with_user_data.updatedAt.toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        iat: expect.any(Number),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        exp: expect.any(Number),
      });
    });

    it('should generate a JWT cookie ', async () => {
      const mock_request_with_user_data = {
        user: adminUser,
      } as AuthenticatedRequestDto;

      const signedJwtToken = await authService.generateJwtForUser({
        ...adminUser,
        client: CLIENT_MOCK_DATA,
      });

      const cookie = authService.generateJwtCookie(
        mock_request_with_user_data,
        signedJwtToken,
      );

      const maxAgeInSeconds = COOKIE_MAX_AGE_IN_MS / 1000;

      expect(cookie).toContain(`user_token=${signedJwtToken}`);
      expect(cookie).toContain(`domain=${process.env.BASE_URL_DOMAIN}`);
      expect(cookie).toContain('Secure');
      expect(cookie).toContain(`max-age=${maxAgeInSeconds}`);
    });

    it('should return an empty expired cookie', () => {
      const mock_request_with_user_data = {
        user: adminUser,
      } as AuthenticatedRequestDto;
      const cookie = authService.generateExpiredCookie(
        mock_request_with_user_data,
      );

      expect(cookie).toContain(`user_token=;`);
      expect(cookie).toContain(`max-age=${0}`);
    });
  });
});
