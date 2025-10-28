import { JwtService } from '@nestjs/jwt';
import { QueueUserController } from './queue-user.controller';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { QueueUserDto } from './queue-user.dto';

const QUEUE_USER_MOCK_DATA = [
  {
    name: 'Queue User A',
    email: 'queueusera@example.com',
    passwordHash: 'passwordHashA',
  },
  {
    name: 'Queue User B',
    email: 'queueuserb@example.com',
    passwordHash: 'passwordHashB',
  },
  {
    name: 'Queue User C',
    email: 'queueuserc@example.com',
    passwordHash: 'passwordHashC',
  },
];

describe('QueueUserController', () => {
  let queueUserController: QueueUserController;
  let jwtService: JwtService;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    queueUserController = module.get<QueueUserController>(QueueUserController);
    jwtService = module.get<JwtService>(JwtService);

    await TestModuleSingleton.cleanUpDatabase();
  });

  it('should be defined', () => {
    expect(queueUserController).toBeDefined();
  });

  describe('/queue-user/create-and-signin', () => {
    it('should throw a BadRequestException if email is missing', async () => {
      await TestModuleSingleton.callEndpoint()
        .post('/queue-user/create-and-signin')
        .send({
          ...QUEUE_USER_MOCK_DATA[0],
          email: '',
        })
        .expect(400);
    });

    it('should throw a BadRequestException if email is invalid', async () => {
      await TestModuleSingleton.callEndpoint()
        .post('/queue-user/create-and-signin')
        .send({
          ...QUEUE_USER_MOCK_DATA[0],
          email: 'invalid-email-format',
        })
        .expect(400);
    });

    it('should throw a BadRequestException if name is missing', async () => {
      await TestModuleSingleton.callEndpoint()
        .post('/queue-user/create-and-signin')
        .send({
          ...QUEUE_USER_MOCK_DATA[0],
          name: '',
        })
        .expect(400);
    });

    it('should throw a BadRequestException if passwordHash is missing', async () => {
      await TestModuleSingleton.callEndpoint()
        .post('/queue-user/create-and-signin')
        .send({
          ...QUEUE_USER_MOCK_DATA[0],
          passwordHash: '',
        })
        .expect(400);
    });

    it('should create a Queue User', async () => {
      const response = await TestModuleSingleton.callEndpoint()
        .post('/queue-user/create-and-signin')
        .send(QUEUE_USER_MOCK_DATA[0])
        .expect(201);

      const userTokenCookie = response.headers['set-cookie'][0];
      const userTokenFromCookie = userTokenCookie
        .split('user_token=')[1]
        .split(';')[0];

      expect(response.headers['set-cookie']).toBeDefined();

      const decodedUserToken: QueueUserDto =
        jwtService.decode(userTokenFromCookie);

      expect(decodedUserToken).toHaveProperty('id');
      expect(decodedUserToken.name).toBe(QUEUE_USER_MOCK_DATA[0].name);
      expect(decodedUserToken.email).toBe(QUEUE_USER_MOCK_DATA[0].email);
    });

    it('should throw a Error if email already exists', async () => {
      await TestModuleSingleton.callEndpoint()
        .post('/queue-user/create-and-signin')
        .send(QUEUE_USER_MOCK_DATA[0])
        .expect(400);
    });
  });
});
