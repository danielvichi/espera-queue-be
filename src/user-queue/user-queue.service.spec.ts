import { Test, TestingModule } from '@nestjs/testing';
import { UserQueueService } from './user-queue.service';

describe('UserQueueService', () => {
  let service: UserQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserQueueService],
    }).compile();

    service = module.get<UserQueueService>(UserQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
