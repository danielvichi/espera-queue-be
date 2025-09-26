import { INestApplication, ModuleMetadata } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
// import { PrismaClient } from 'generated/prisma';
import { PrismaClient } from '@prisma/client';
import { AppModule } from 'src/app.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';

type TestModuleParams = {
  moduleMetadata?: ModuleMetadata;
};

/** Singleton that enables generating Test Modules with the same PrismaClient instance
 *
 */
export class TestModuleSingleton {
  static readonly prismaClient: PrismaClient = new PrismaClient();
  static app: INestApplication;

  static async createTestModule({
    moduleMetadata = {},
  }: TestModuleParams = {}): Promise<TestingModule> {
    const testModuleBeforeCompile = Test.createTestingModule({
      ...moduleMetadata,
      imports: [
        /** include AppModule by default */
        AppModule,
        /** include PrismaModule by default */
        PrismaModule,
        /** include HelperModule by default */
        ...(moduleMetadata.imports || []),
      ],
    })
      /** Use a single prisma client instance by default */
      .overrideProvider(PrismaService)
      .useValue(this.prismaClient);

    const testModule = await testModuleBeforeCompile.compile();

    this.app = testModule.createNestApplication();
    await this.app.init();

    return testModule;
  }

  static async cleanUpDatabase() {
    await this.prismaClient.admin.deleteMany();
    await this.prismaClient.client.deleteMany();
    await this.prismaClient.queue.deleteMany();
    await this.prismaClient.unity.deleteMany();
    await this.prismaClient.userQueued.deleteMany();
  }
}
