import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload, logLevel } from 'kafkajs';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationCategory, NotificationType } from '../domain/entities/notification.entity';

@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {
    const brokers = this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(',');

    this.kafka = new Kafka({
      clientId: 'notification-service',
      brokers,
      logLevel: logLevel.WARN,
    });

    this.consumer = this.kafka.consumer({ groupId: 'notification-service-group' });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topics: [
        'rdv.created',
        'rdv.confirmed',
        'rdv.rescheduled',
        'rdv.cancelled',
        'rdv.completed',
        'rdv.no_show',
        'payment.succeeded',
        'payment.failed',
      ], fromBeginning: false });

      await this.consumer.run({
        eachMessage: async (payload) => {
          await this.handleMessage(payload);
        },
      });

      this.logger.log('Kafka consumer started');
    } catch (error) {
      this.logger.error('Failed to start Kafka consumer', error);
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, message } = payload;

    try {
      const data = JSON.parse(message.value?.toString() || '{}');
      this.logger.debug(`Received event: ${topic}`);

      switch (topic) {
        case 'rdv.created':
          await this.handleRdvCreated(data);
          break;
        case 'rdv.confirmed':
          await this.handleRdvConfirmed(data);
          break;
        case 'rdv.rescheduled':
          await this.handleRdvRescheduled(data);
          break;
        case 'rdv.cancelled':
          await this.handleRdvCancelled(data);
          break;
        case 'rdv.completed':
          await this.handleRdvCompleted(data);
          break;
        case 'payment.succeeded':
          await this.handlePaymentSucceeded(data);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(data);
          break;
      }
    } catch (error) {
      this.logger.error(`Error processing message from ${topic}:`, error);
    }
  }

  private async handleRdvCreated(data: any): Promise<void> {
    const { tenant_id, client_telephone, client_email, date, heure_debut, type_controle, centre_nom } = data;

    const templateData = {
      date: this.formatDate(date),
      heure: heure_debut,
      type_controle,
      centre: centre_nom || 'votre centre',
    };

    // Envoyer SMS de confirmation
    if (client_telephone) {
      await this.notificationsService.sendSms({
        phone: client_telephone,
        content: `Votre RDV pour ${type_controle} est confirmé le ${templateData.date} à ${templateData.heure} chez ${templateData.centre}. PTI Calendar`,
        rdv_id: data.rdv_id,
        category: NotificationCategory.RDV_CONFIRMATION,
      }, tenant_id);
    }

    // Envoyer email de confirmation
    if (client_email) {
      await this.notificationsService.sendEmail({
        email: client_email,
        subject: `Confirmation de votre RDV - ${templateData.date}`,
        content: `Votre rendez-vous pour ${type_controle} est confirmé.\n\nDate: ${templateData.date}\nHeure: ${templateData.heure}\nCentre: ${templateData.centre}\n\nCordialement,\nPTI Calendar`,
        rdv_id: data.rdv_id,
        category: NotificationCategory.RDV_CONFIRMATION,
      }, tenant_id);
    }

    // Planifier le rappel 24h avant
    const rdvDate = new Date(`${date}T${heure_debut}`);
    const rappel24h = new Date(rdvDate.getTime() - 24 * 60 * 60 * 1000);

    if (rappel24h > new Date() && client_telephone) {
      await this.notificationsService.sendSms({
        phone: client_telephone,
        content: `Rappel: Votre RDV ${type_controle} est demain à ${heure_debut}. N'oubliez pas votre carte grise et certificat d'assurance. PTI Calendar`,
        rdv_id: data.rdv_id,
        category: NotificationCategory.RDV_RAPPEL_24H,
        scheduled_at: rappel24h.toISOString(),
      }, tenant_id);
    }
  }

  private async handleRdvConfirmed(data: any): Promise<void> {
    const { tenant_id, client_telephone, client_email, date, heure_debut, centre_nom } = data;

    if (client_telephone) {
      await this.notificationsService.sendSms({
        phone: client_telephone,
        content: `Votre RDV du ${this.formatDate(date)} à ${heure_debut} est confirmé. Nous vous attendons chez ${centre_nom || 'notre centre'}. PTI Calendar`,
        rdv_id: data.rdv_id,
        category: NotificationCategory.RDV_CONFIRMATION,
      }, tenant_id);
    }
  }

  private async handleRdvRescheduled(data: any): Promise<void> {
    const { tenant_id, client_telephone, client_email, nouvelle_date, nouvelle_heure, ancienne_date, ancienne_heure } = data;

    if (client_telephone) {
      await this.notificationsService.sendSms({
        phone: client_telephone,
        content: `Votre RDV a été modifié. Nouvelle date: ${this.formatDate(nouvelle_date)} à ${nouvelle_heure}. PTI Calendar`,
        rdv_id: data.rdv_id,
        category: NotificationCategory.RDV_MODIFICATION,
      }, tenant_id);
    }

    if (client_email) {
      await this.notificationsService.sendEmail({
        email: client_email,
        subject: `Modification de votre RDV`,
        content: `Votre rendez-vous initialement prévu le ${this.formatDate(ancienne_date)} à ${ancienne_heure} a été replanifié.\n\nNouvelle date: ${this.formatDate(nouvelle_date)}\nNouvelle heure: ${nouvelle_heure}\n\nCordialement,\nPTI Calendar`,
        rdv_id: data.rdv_id,
        category: NotificationCategory.RDV_MODIFICATION,
      }, tenant_id);
    }
  }

  private async handleRdvCancelled(data: any): Promise<void> {
    const { tenant_id, client_telephone, client_email, motif } = data;

    if (client_telephone) {
      await this.notificationsService.sendSms({
        phone: client_telephone,
        content: `Votre RDV a été annulé. Pour reprendre RDV: https://rdv.pti-calendar.fr. PTI Calendar`,
        rdv_id: data.rdv_id,
        category: NotificationCategory.RDV_ANNULATION,
      }, tenant_id);
    }
  }

  private async handleRdvCompleted(data: any): Promise<void> {
    const { tenant_id, resultat, date_limite_cv, client_id, immatriculation } = data;

    // Si contre-visite nécessaire, planifier des rappels
    if ((resultat === 'S' || resultat === 'R') && date_limite_cv) {
      // Rappel 7 jours avant la date limite
      const rappelDate = new Date(date_limite_cv);
      rappelDate.setDate(rappelDate.getDate() - 7);

      // TODO: Récupérer les infos du client pour envoyer le rappel
      this.logger.log(`Rappel contre-visite planifié pour ${immatriculation}`);
    }
  }

  private async handlePaymentSucceeded(data: any): Promise<void> {
    // Le paiement est géré au niveau du RDV Service
    this.logger.debug(`Payment succeeded for RDV ${data.rdv_id}`);
  }

  private async handlePaymentFailed(data: any): Promise<void> {
    // Notification d'échec de paiement si nécessaire
    this.logger.warn(`Payment failed for RDV ${data.rdv_id}: ${data.error}`);
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }
}
