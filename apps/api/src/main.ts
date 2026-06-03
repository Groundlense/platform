import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { SwaggerModule } from '@nestjs/swagger';
import { DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(
      AppModule,
    );

  app.useStaticAssets(
    join(process.cwd(), 'uploads'),
    {
      prefix: '/uploads/',
    },
  );

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config =
    new DocumentBuilder()
      .setTitle('GroundLense API')
      .setDescription(
        'GroundLense Geotechnical Investigation Platform',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();

  const document =
    SwaggerModule.createDocument(
      app,
      config,
    );

  SwaggerModule.setup(
    'api/docs',
    app,
    document,
  );

  await app.listen(3000);
}

bootstrap();