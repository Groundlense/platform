import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import { DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // NOTE: uploads are intentionally NOT served as public static assets.
  // Field photos are project-scoped evidence; they are served through the
  // authenticated GET media/:id/file route with project-access checks.

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('GroundLense API')
    .setDescription('GroundLense Geotechnical Investigation Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 8000);

  // Keep sockets open longer than any client-side connection pool (the
  // mobile app's HTTP stack reuses idle sockets for up to 5 minutes).
  // Node's 5s default made the server close sockets the app was about to
  // reuse, surfacing as intermittent "Network Error" on sync.
  const server = app.getHttpServer();
  server.keepAliveTimeout = 310_000;
  server.headersTimeout = 315_000;
}

bootstrap();
