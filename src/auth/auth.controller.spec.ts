import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { AuthController } from './auth.controller';
import {
  AdminResponseDto,
  AdminWithClientDto,
  CreatedAdminDto,
} from 'src/admin/admin.dto';
import { AdminService } from 'src/admin/admin.service';
import { AdminRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { ClientDto, InputClientDto } from 'src/client/client.dto';
import { ClientService } from 'src/client/client.service';

const ADMIN_MOCK_DATA: Omit<CreatedAdminDto, 'clientId'> = {
  name: 'Admin Name',
  email: 'admin@email.com',
  passwordHash: 'password_hash',
  role: AdminRole.QUEUE_ADMIN,
  queueIds: ['1'],
};

const CLIENT_MOCK_DATA: InputClientDto = {
  name: 'Client Serv A',
  address: 'Client address in the client format.',
  phone: '+1-234-567-8900',
};

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let adminService: AdminService;
  let jwtService: JwtService;
  let clientService: ClientService;
  let adminUser: AdminResponseDto;
  let client: ClientDto;
  const loginData = ADMIN_MOCK_DATA;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    adminService = module.get<AdminService>(AdminService);
    clientService = module.get<ClientService>(ClientService);

    await TestModuleSingleton.cleanUpDatabase();

    client = await clientService.createClient({
      ...CLIENT_MOCK_DATA,
    });

    adminUser = await adminService.createAdmin({
      ...ADMIN_MOCK_DATA,
      clientId: client.id,
    });
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

      const decodedUserToken: AdminWithClientDto =
        jwtService.decode(userTokenFromCookie);

      expect(decodedUserToken.email).toMatch(loginData.email);
      expect(decodedUserToken.id).toMatch(adminUser.id);
      expect(decodedUserToken.client).not.toBeNull();
    });
  });

  describe('/auth/logout', () => {
    it('should replace a valid cookie session by and empty expired one', async () => {
      const userToken = await authService.generateJwtForUser({
        ...adminUser,
        client: client,
      });

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
});
