import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api/v1/rdv');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGINS', '*').split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-user-id'],
    credentials: true,
  });

  // Swagger
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('PTI Calendar - RDV Service')
      .setDescription('API de gestion des rendez-vous pour les contrôles techniques')
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey(
        { type: 'apiKey', name: 'x-tenant-id', in: 'header' },
        'tenant-id',
      )
      .addTag('rdv', 'Gestion des rendez-vous')
      .addTag('clients', 'Gestion des clients et véhicules')
      .addTag('health', 'Health checks')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/v1/rdv/docs', app, document);
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = configService.get('PORT', 4002);
  await app.listen(port);

  logger.log(`RDV Service is running on port ${port}`);
  logger.log(`Environment: ${configService.get('NODE_ENV', 'development')}`);
  if (configService.get('NODE_ENV') !== 'production') {
    logger.log(`Swagger: http://localhost:${port}/api/v1/rdv/docs`);
  }
}

bootstrap();
