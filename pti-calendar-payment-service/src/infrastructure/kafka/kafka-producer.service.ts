import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, logLevel } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    const brokers = this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(',');

    this.kafka = new Kafka({
      clientId: 'payment-service',
      brokers,
      logLevel: logLevel.WARN,
    });

    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log('Kafka producer connected');
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer', error);
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.producer.disconnect();
    }
  }

  async emit(topic: string, message: any): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn(`Kafka not connected, skipping event: ${topic}`);
      return;
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: message.payment_id || message.id || String(Date.now()),
            value: JSON.stringify({
              ...message,
              timestamp: new Date().toISOString(),
              service: 'payment-service',
            }),
          },
        ],
      });
      this.logger.debug(`Event emitted to ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to emit event to ${topic}`, error);
    }
  }
}
