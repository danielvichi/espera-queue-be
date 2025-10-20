import { Test, TestingModule } from '@nestjs/testing';
import { UnityService } from './unity.service';

describe('UnityService', () => {
  let service: UnityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UnityService],
    }).compile();

    service = module.get<UnityService>(UnityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
