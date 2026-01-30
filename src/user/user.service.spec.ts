import { CreateUserDto } from './user.dto';
import { defaultQueueUserExceptionsMessage } from './user.exceptions';
import { UserService } from './user.service';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';

const CREATE_QUEUE_USER_MOCK_DATA: CreateUserDto[] = [
  {
    name: 'John Doe',
    email: 'john_doe@example.com',
    passwordHash: 'password_hash',
  },
  {
    name: 'Sarah Smith',
    email: 'sarah_smith@example.com',
    passwordHash: 'password_hash',
  },
];

describe('UserService', () => {
  let userService: UserService;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    userService = module.get<UserService>(UserService);

    await TestModuleSingleton.cleanUpDatabase();
  });

  afterAll(async () => {
    await TestModuleSingleton.endClient();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('createQueueUser', () => {
    it('should create a Queue User ', async () => {
      const queueUserData = CREATE_QUEUE_USER_MOCK_DATA[0];

      const createdUserQueue = await userService.createQueueUser(queueUserData);

      expect(createdUserQueue.id).toBeDefined();
      expect(createdUserQueue).toMatchObject({
        name: queueUserData.name,
        email: queueUserData.email,
      });
    });

    it('should NOT create a Queue User if emails already exists', async () => {
      const queueUserData = CREATE_QUEUE_USER_MOCK_DATA[0];

      await expect(userService.createQueueUser(queueUserData)).rejects.toThrow(
        new Error(defaultQueueUserExceptionsMessage.EMAIL_ALREADY_EXISTS),
      );
    });
  });
});
