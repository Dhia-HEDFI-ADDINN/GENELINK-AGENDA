import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001'],
    credentials: true,
  });

  app.setGlobalPrefix(process.env.API_PREFIX || '/api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('PTI Calendar - Planning Service')
      .setDescription('API de gestion des plannings et disponibilités')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('planning', 'Gestion des plannings')
      .addTag('disponibilites', 'Calcul des disponibilités')
      .addTag('creneaux', 'Gestion des créneaux')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  // Kafka Microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: process.env.KAFKA_CLIENT_ID || 'planning-service',
        brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      },
      consumer: {
        groupId: process.env.KAFKA_GROUP_ID || 'planning-service-group',
      },
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT || 4001;
  await app.listen(port);

  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║   PTI CALENDAR - Planning Service                         ║
  ╠═══════════════════════════════════════════════════════════╣
  ║   🚀 Server running on: http://localhost:${port}             ║
  ║   📚 API Docs: http://localhost:${port}/docs                 ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
