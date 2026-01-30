import { Test, TestingModule } from '@nestjs/testing';
import { QueuedUserController } from './queued-user.controller';

describe('QueuedUserController', () => {
  let controller: QueuedUserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueuedUserController],
    }).compile();

    controller = module.get<QueuedUserController>(QueuedUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
