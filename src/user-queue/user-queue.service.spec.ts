import { CreateUserQueueDto } from './user-queue.dto';
import { defaultUserQueueExceptionsMessage } from './user-queue.exceptions';
import { UserQueueService } from './user-queue.service';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';

const CREATE_USER_QUEUE_MOCK_DATA: CreateUserQueueDto[] = [
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

describe('UserQueueService', () => {
  let userQueueService: UserQueueService;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    userQueueService = module.get<UserQueueService>(UserQueueService);

    await TestModuleSingleton.cleanUpDatabase();
  });

  it('should be defined', () => {
    expect(userQueueService).toBeDefined();
  });

  describe('createUserQueue', () => {
    it('should create a User Queue ', async () => {
      const userQueueData = CREATE_USER_QUEUE_MOCK_DATA[0];

      const createdUserQueue =
        await userQueueService.createUserQueue(userQueueData);

      expect(createdUserQueue.id).toBeDefined();
      expect(createdUserQueue).toMatchObject({
        name: userQueueData.name,
        email: userQueueData.email,
      });
    });

    it('should NOT create a User Queue if emails already exists', async () => {
      const userQueueData = CREATE_USER_QUEUE_MOCK_DATA[0];

      await expect(
        userQueueService.createUserQueue(userQueueData),
      ).rejects.toThrow(
        new Error(defaultUserQueueExceptionsMessage.EMAIL_ALREADY_EXISTS),
      );
    });
  });
});
