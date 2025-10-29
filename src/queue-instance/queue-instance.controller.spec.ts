import { Test, TestingModule } from '@nestjs/testing';
import { QueueInstanceController } from './queue-instance.controller';

describe('QueueInstanceController', () => {
  let controller: QueueInstanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueInstanceController],
    }).compile();

    controller = module.get<QueueInstanceController>(QueueInstanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
