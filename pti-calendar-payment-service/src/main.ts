import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for Stripe webhook
  });

  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1/payment');

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

  app.enableCors({
    origin: configService.get('CORS_ORIGINS', '*').split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-user-id', 'x-centre-id', 'stripe-signature'],
    credentials: true,
  });

  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('PTI Calendar - Payment Service')
      .setDescription('API de gestion des paiements avec intégration Stripe')
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'x-tenant-id', in: 'header' }, 'tenant-id')
      .addTag('payments', 'Gestion des paiements')
      .addTag('health', 'Health checks')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/v1/payment/docs', app, document);
  }

  app.enableShutdownHooks();

  const port = configService.get('PORT', 4003);
  await app.listen(port);

  logger.log(`Payment Service is running on port ${port}`);
  if (configService.get('NODE_ENV') !== 'production') {
    logger.log(`Swagger: http://localhost:${port}/api/v1/payment/docs`);
  }
}

bootstrap();
