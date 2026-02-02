import { JwtService } from '@nestjs/jwt';
import { UserController } from './user.controller';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { UserDto } from './user.dto';

const USER_MOCK_DATA = [
  {
    name: 'User A',
    email: 'queueusera@example.com',
    passwordHash: 'passwordHashA',
  },
  {
    name: 'User B',
    email: 'queueuserb@example.com',
    passwordHash: 'passwordHashB',
  },
  {
    name: 'User C',
    email: 'queueuserc@example.com',
    passwordHash: 'passwordHashC',
  },
];

describe('UserController', () => {
  let queueUserController: UserController;
  let jwtService: JwtService;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    queueUserController = module.get<UserController>(UserController);
    jwtService = module.get<JwtService>(JwtService);

    await TestModuleSingleton.cleanUpDatabase();
  });

  afterAll(async () => {
    await TestModuleSingleton.endClient();
  });

  it('should be defined', () => {
    expect(queueUserController).toBeDefined();
  });

  describe('/user/create-and-signin', () => {
    it('should throw a BadRequestException if email is missing', async () => {
      await TestModuleSingleton.callEndpoint()
        .post('/user/create-and-signin')
        .send({
          ...USER_MOCK_DATA[0],
          email: '',
        })
        .expect(400);
    });

    it('should throw a BadRequestException if email is invalid', async () => {
      await TestModuleSingleton.callEndpoint()
        .post('/user/create-and-signin')
        .send({
          ...USER_MOCK_DATA[0],
          email: 'invalid-email-format',
        })
        .expect(400);
    });

    it('should throw a BadRequestException if name is missing', async () => {
      await TestModuleSingleton.callEndpoint()
        .post('/user/create-and-signin')
        .send({
          ...USER_MOCK_DATA[0],
          name: '',
        })
        .expect(400);
    });

    it('should throw a BadRequestException if passwordHash is missing', async () => {
      await TestModuleSingleton.callEndpoint()
        .post('/user/create-and-signin')
        .send({
          ...USER_MOCK_DATA[0],
          passwordHash: '',
        })
        .expect(400);
    });

    it('should create a User', async () => {
      const response = await TestModuleSingleton.callEndpoint()
        .post('/user/create-and-signin')
        .send(USER_MOCK_DATA[0])
        .expect(201);

      const userTokenCookie = response.headers['set-cookie'][0];
      const userTokenFromCookie = userTokenCookie
        .split('user_token=')[1]
        .split(';')[0];

      expect(response.headers['set-cookie']).toBeDefined();

      const decodedUserToken: UserDto = jwtService.decode(userTokenFromCookie);

      expect(decodedUserToken).toHaveProperty('id');
      expect(decodedUserToken.name).toBe(USER_MOCK_DATA[0].name);
      expect(decodedUserToken.email).toBe(USER_MOCK_DATA[0].email);
    });

    it('should throw a Error if email already exists', async () => {
      await TestModuleSingleton.callEndpoint()
        .post('/user/create-and-signin')
        .send(USER_MOCK_DATA[0])
        .expect(400);
    });
  });
});
