import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let authController: AuthController;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    authController = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });
});
