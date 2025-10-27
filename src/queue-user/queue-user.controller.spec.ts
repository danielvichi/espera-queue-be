import { Test, TestingModule } from '@nestjs/testing';
import { QueueUserController } from './queue-user.controller';

describe('QueueUserController', () => {
  let controller: QueueUserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueUserController],
    }).compile();

    controller = module.get<QueueUserController>(QueueUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
