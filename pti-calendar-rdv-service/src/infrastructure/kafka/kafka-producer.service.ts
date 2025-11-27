import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, ProducerRecord, logLevel } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    const brokers = this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(',');

    this.kafka = new Kafka({
      clientId: 'rdv-service',
      brokers,
      logLevel: logLevel.WARN,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
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
      this.logger.log('Kafka producer disconnected');
    }
  }

  async emit(topic: string, message: any): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn(`Kafka not connected, skipping event: ${topic}`);
      return;
    }

    try {
      const record: ProducerRecord = {
        topic,
        messages: [
          {
            key: message.rdv_id || message.id || String(Date.now()),
            value: JSON.stringify({
              ...message,
              timestamp: new Date().toISOString(),
              service: 'rdv-service',
            }),
            headers: {
              'content-type': 'application/json',
            },
          },
        ],
      };

      await this.producer.send(record);
      this.logger.debug(`Event emitted to ${topic}: ${message.rdv_id || 'unknown'}`);
    } catch (error) {
      this.logger.error(`Failed to emit event to ${topic}`, error);
      // Ne pas throw pour ne pas bloquer le flux principal
    }
  }

  async emitBatch(topic: string, messages: any[]): Promise<void> {
    if (!this.isConnected || messages.length === 0) {
      return;
    }

    try {
      const record: ProducerRecord = {
        topic,
        messages: messages.map((msg) => ({
          key: msg.rdv_id || msg.id || String(Date.now()),
          value: JSON.stringify({
            ...msg,
            timestamp: new Date().toISOString(),
            service: 'rdv-service',
          }),
        })),
      };

      await this.producer.send(record);
      this.logger.debug(`Batch of ${messages.length} events emitted to ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to emit batch to ${topic}`, error);
    }
  }
}
