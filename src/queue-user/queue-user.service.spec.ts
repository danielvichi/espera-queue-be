import { CreateQueueUserDto } from './queue-user.dto';
import { defaultQueueUserExceptionsMessage } from './queue-user.exceptions';
import { QueueUserService } from './queue-user.service';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';

const CREATE_QUEUE_USER_MOCK_DATA: CreateQueueUserDto[] = [
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

describe('QueueUserService', () => {
  let queueUserService: QueueUserService;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    queueUserService = module.get<QueueUserService>(QueueUserService);

    await TestModuleSingleton.cleanUpDatabase();
  });

  it('should be defined', () => {
    expect(queueUserService).toBeDefined();
  });

  describe('createQueueUser', () => {
    it('should create a Queue User ', async () => {
      const queueUserData = CREATE_QUEUE_USER_MOCK_DATA[0];

      const createdUserQueue =
        await queueUserService.createQueueUser(queueUserData);

      expect(createdUserQueue.id).toBeDefined();
      expect(createdUserQueue).toMatchObject({
        name: queueUserData.name,
        email: queueUserData.email,
      });
    });

    it('should NOT create a Queue User if emails already exists', async () => {
      const queueUserData = CREATE_QUEUE_USER_MOCK_DATA[0];

      await expect(
        queueUserService.createQueueUser(queueUserData),
      ).rejects.toThrow(
        new Error(defaultQueueUserExceptionsMessage.EMAIL_ALREADY_EXISTS),
      );
    });
  });
});
