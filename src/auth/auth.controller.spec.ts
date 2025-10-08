import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { AuthController } from './auth.controller';
import { AdminResponseDto, CreatedAdminDto } from 'src/admin/admin.dto';
import { AdminService } from 'src/admin/admin.service';
import { AdminRole } from 'generated/prisma';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

const ADMIN_MOCK_DATA: CreatedAdminDto = {
  name: 'Admin Name',
  email: 'admin@email.com',
  passwordHash: 'password_hash',
  role: AdminRole.QUEUE_ADMIN,
  queueIds: ['1'],
};

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let adminService: AdminService;
  let jwtService: JwtService;
  let adminUser: AdminResponseDto;
  const loginData = ADMIN_MOCK_DATA;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    adminService = module.get<AdminService>(AdminService);

    await TestModuleSingleton.cleanUpDatabase();

    adminUser = await adminService.createAdmin(ADMIN_MOCK_DATA);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('/auth/login/admin', () => {
    it('should get Bad Request 400 Error if no credentials is provided', async () => {
      const url = '/auth/login/admin';
      await TestModuleSingleton.callEndpoint().post(url).expect(400);
    });

    it('should get Bad Request 400 Error if email is not provided', async () => {
      const url = '/auth/login/admin';
      await TestModuleSingleton.callEndpoint()
        .post(url)
        .send({
          email: '',
          passwordHash: loginData.passwordHash,
        })
        .expect(400);
    });

    it('should get Bad Request 400 Error if password_hash is not provided', async () => {
      const url = '/auth/login/admin';
      await TestModuleSingleton.callEndpoint()
        .post(url)
        .send({
          email: loginData.email,
          passwordHash: '',
        })
        .expect(400);
    });

    it('should return credentials cookies if correct credentials is provided', async () => {
      const url = '/auth/login/admin';
      const response = await TestModuleSingleton.callEndpoint()
        .post(url)
        .send({
          email: loginData.email,
          passwordHash: loginData.passwordHash,
        })
        .expect(201);
      expect(response.headers['set-cookie']).toBeDefined();

      const userTokenCookie = response.headers['set-cookie'][0];
      const userTokenFromCookie = userTokenCookie
        .split('user_token=')[1]
        .split(';')[0];

      const decodedUserToken: AdminResponseDto =
        jwtService.decode(userTokenFromCookie);

      expect(decodedUserToken.email).toMatch(loginData.email);
      expect(decodedUserToken.id).toMatch(adminUser.id);
    });
  });

  describe('/auth/logout', () => {
    it('should replace a valid cookie session by and empty expired one', async () => {
      const userToken = await authService.generateJwtForUser(adminUser);

      const logoutResponse = await TestModuleSingleton.callEndpoint()
        .post('/auth/logout')
        .set('Cookie', [`user_token=${userToken}`])
        .expect(204);

      expect(logoutResponse.headers['set-cookie']).toBeDefined();

      const userTokenCookie = logoutResponse.headers['set-cookie'][0];
      expect(userTokenCookie.includes('user_token=;')).toBe(true);
      expect(userTokenCookie.includes(`max-age=0`)).toBe(true);
    });
  });

  describe('/auth/profile', () => {
    it('should throw UnauthorizedException for not authenticated sessions', async () => {
      await TestModuleSingleton.callEndpoint()
        .get('/auth/profile')
        .set('Cookie', [`user_token=`])
        .expect(401);
    });

    it('should get profile data for authenticated sessions', async () => {
      const userToken = await authService.generateJwtForUser(adminUser);

      const profileResponse = await TestModuleSingleton.callEndpoint()
        .get('/auth/profile')
        .set('Cookie', [`user_token=${userToken}`])
        .expect(200);

      const userDataFromResponse = profileResponse.body as AdminResponseDto;

      expect(userDataFromResponse).toBeDefined();
      expect(userDataFromResponse['id']).toBe(adminUser.id);
      expect(userDataFromResponse['email']).toBe(adminUser.email);
    });
  });
});
