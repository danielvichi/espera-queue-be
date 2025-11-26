import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { corsOptionsDelegate } from './utils/cors';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(corsOptionsDelegate);
  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('BE API')
    .setVersion('0.1')
    .addBearerAuth()
    .addCookieAuth('optional-session-id-test')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
