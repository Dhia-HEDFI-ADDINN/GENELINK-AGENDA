import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KafkaConsumerService } from './kafka-consumer.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ConfigModule, forwardRef(() => NotificationsModule)],
  providers: [KafkaConsumerService],
  exports: [KafkaConsumerService],
})
export class KafkaModule {}
