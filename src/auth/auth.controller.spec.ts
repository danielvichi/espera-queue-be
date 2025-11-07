import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { AuthController } from './auth.controller';
import {
  AdminResponseDto,
  AdminWithClientDto,
  CreatedAdminDto,
} from 'src/admin/admin.dto';
import { AdminRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { ClientDto, CreateClientDto } from 'src/client/client.dto';
import {
  CreateQueueUserDto,
  QueueUserDto,
} from 'src/queue-user/queue-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

const ADMIN_MOCK_DATA: Omit<CreatedAdminDto, 'clientId'> = {
  name: 'Admin Name',
  email: 'admin@email.com',
  passwordHash: 'password_hash',
  role: AdminRole.QUEUE_ADMIN,
  queueIds: ['1'],
};

const QUEUE_USER_MOCK_DATA: Omit<CreateQueueUserDto, 'clientId'> = {
  name: 'Queue User Name',
  email: 'queue_user@email.com',
  passwordHash: 'password_hash',
};

const CLIENT_MOCK_DATA: CreateClientDto = {
  name: 'Client Serv A',
  address: 'Client address in the client format.',
  phone: '+1-234-567-8900',
};

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let prismaSerivce: PrismaService;
  let jwtService: JwtService;
  let adminUser: AdminResponseDto;
  let queueUser: QueueUserDto;
  let client: ClientDto;
  const adminLoginData = ADMIN_MOCK_DATA;
  const queueLoginData = QUEUE_USER_MOCK_DATA;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    prismaSerivce = module.get<PrismaService>(PrismaService);

    // adminService = module.get<AdminService>(AdminService);
    // clientService = module.get<ClientService>(ClientService);

    await TestModuleSingleton.cleanUpDatabase();

    const clientResponse = await prismaSerivce.client.create({
      data: CLIENT_MOCK_DATA,
    });

    client = {
      ...clientResponse,
      phone: clientResponse.phone ?? undefined,
      address: clientResponse.address ?? undefined,
    };

    adminUser = await prismaSerivce.admin.create({
      data: {
        ...ADMIN_MOCK_DATA,
        clientId: client.id,
      },
    });

    queueUser = await prismaSerivce.queueUser.create({
      data: QUEUE_USER_MOCK_DATA,
    });
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('/auth/login/admin', () => {
    it('should get BadRequestException if no credentials is provided', async () => {
      const url = '/auth/login/admin';
      await TestModuleSingleton.callEndpoint().get(url).expect(400);
    });

    it('should get BadRequestException if email is not provided', async () => {
      const url = '/auth/login/admin';
      await TestModuleSingleton.callEndpoint()
        .get(url)
        .send({
          email: '',
          passwordHash: adminLoginData.passwordHash,
        })
        .expect(400);
    });

    it('should get BadRequestException if password_hash is not provided', async () => {
      const url = '/auth/login/admin';
      await TestModuleSingleton.callEndpoint()
        .get(url)
        .send({
          email: adminLoginData.email,
          passwordHash: '',
        })
        .expect(400);
    });

    it('should throw NotFoundException if user credentials does not exist', async () => {
      const url = '/auth/login/admin';
      await TestModuleSingleton.callEndpoint()
        .get(url)
        .send({
          email: 'non-existing-admin@email.com',
          passwordHash: 'some_password_hash',
        })
        .expect(404);
    });

    it('should return credentials cookies if correct credentials is provided', async () => {
      const url = '/auth/login/admin';
      const response = await TestModuleSingleton.callEndpoint()
        .get(url)
        .send({
          email: adminLoginData.email,
          passwordHash: adminLoginData.passwordHash,
        })
        .expect(200);
      expect(response.headers['set-cookie']).toBeDefined();

      const userTokenCookie = response.headers['set-cookie'][0];
      const userTokenFromCookie = userTokenCookie
        .split('user_token=')[1]
        .split(';')[0];

      const decodedUserToken: AdminWithClientDto =
        jwtService.decode(userTokenFromCookie);

      expect(decodedUserToken.email).toMatch(adminLoginData.email);
      expect(decodedUserToken.id).toMatch(adminUser.id);
      expect(decodedUserToken.client).not.toBeNull();
    });
  });

  describe('/auth/login/queue-user', () => {
    it('should get BadRequestException if no credentials is provided', async () => {
      const url = '/auth/login/queue-user';
      await TestModuleSingleton.callEndpoint().get(url).expect(400);
    });

    it('should get BadRequestException if email is not provided', async () => {
      const url = '/auth/login/queue-user';
      await TestModuleSingleton.callEndpoint()
        .get(url)
        .send({
          email: '',
          passwordHash: queueLoginData.passwordHash,
        })
        .expect(400);
    });

    it('should get BadRequestException if password_hash is not provided', async () => {
      const url = '/auth/login/queue-user';
      await TestModuleSingleton.callEndpoint()
        .get(url)
        .send({
          email: queueLoginData.email,
          passwordHash: '',
        })
        .expect(400);
    });

    it('should throw NotFoundException if user credentials does not exist', async () => {
      const url = '/auth/login/queue-user';
      await TestModuleSingleton.callEndpoint()
        .get(url)
        .send({
          email: 'non-existing-user@email.com',
          passwordHash: 'some_password_hash',
        })
        .expect(404);
    });

    it('should return credentials cookies if correct credentials is provided', async () => {
      const url = '/auth/login/queue-user';
      const response = await TestModuleSingleton.callEndpoint()
        .get(url)
        .send({
          email: queueLoginData.email,
          passwordHash: queueLoginData.passwordHash,
        })
        .expect(200);
      expect(response.headers['set-cookie']).toBeDefined();

      const userTokenCookie = response.headers['set-cookie'][0];
      const userTokenFromCookie = userTokenCookie
        .split('user_token=')[1]
        .split(';')[0];

      const decodedUserToken: AdminWithClientDto =
        jwtService.decode(userTokenFromCookie);

      expect(decodedUserToken.email).toMatch(queueLoginData.email);
      expect(decodedUserToken.id).toMatch(queueUser.id);
    });
  });

  describe('/auth/logout', () => {
    it('should replace a valid cookie session by and empty expired one', async () => {
      const userToken = await authService.generateJwtForUser({
        ...adminUser,
        client: client,
      });

      const logoutResponse = await TestModuleSingleton.callEndpoint()
        .get('/auth/logout')
        .set('Cookie', [`user_token=${userToken}`])
        .expect(204);

      expect(logoutResponse.headers['set-cookie']).toBeDefined();

      const userTokenCookie = logoutResponse.headers['set-cookie'][0];
      expect(userTokenCookie.includes('user_token=;')).toBe(true);
      expect(userTokenCookie.includes(`max-age=0`)).toBe(true);
    });
  });
});
