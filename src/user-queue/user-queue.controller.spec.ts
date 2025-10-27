import { Test, TestingModule } from '@nestjs/testing';
import { UserQueueController } from './user-queue.controller';

describe('UserQueueController', () => {
  let controller: UserQueueController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserQueueController],
    }).compile();

    controller = module.get<UserQueueController>(UserQueueController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
