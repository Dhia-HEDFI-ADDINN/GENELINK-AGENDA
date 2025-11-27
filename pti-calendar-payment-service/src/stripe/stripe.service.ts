import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export interface CreatePaymentIntentParams {
  amount: number; // in cents
  currency: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, string>;
  receiptEmail?: string;
}

export interface RefundParams {
  paymentIntentId: string;
  amount?: number; // partial refund in cents
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('Stripe secret key not configured - payments will fail');
    }

    this.stripe = new Stripe(secretKey || 'sk_test_placeholder', {
      apiVersion: '2023-10-16',
      typescript: true,
    });
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: params.amount,
        currency: params.currency || 'eur',
        customer: params.customerId,
        description: params.description,
        metadata: params.metadata,
        receipt_email: params.receiptEmail,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      this.logger.log(`PaymentIntent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to create PaymentIntent: ${(error as Error).message}`);
      throw new BadRequestException(`Stripe error: ${(error as Error).message}`);
    }
  }

  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      const params: Stripe.PaymentIntentConfirmParams = {};
      if (paymentMethodId) {
        params.payment_method = paymentMethodId;
      }

      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, params);
      this.logger.log(`PaymentIntent confirmed: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to confirm PaymentIntent: ${(error as Error).message}`);
      throw new BadRequestException(`Stripe error: ${(error as Error).message}`);
    }
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error(`Failed to retrieve PaymentIntent: ${(error as Error).message}`);
      throw new BadRequestException(`Stripe error: ${(error as Error).message}`);
    }
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);
      this.logger.log(`PaymentIntent cancelled: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to cancel PaymentIntent: ${(error as Error).message}`);
      throw new BadRequestException(`Stripe error: ${(error as Error).message}`);
    }
  }

  async createRefund(params: RefundParams): Promise<Stripe.Refund> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: params.paymentIntentId,
        reason: params.reason || 'requested_by_customer',
      };

      if (params.amount) {
        refundParams.amount = params.amount;
      }

      const refund = await this.stripe.refunds.create(refundParams);
      this.logger.log(`Refund created: ${refund.id} for PaymentIntent: ${params.paymentIntentId}`);
      return refund;
    } catch (error) {
      this.logger.error(`Failed to create refund: ${(error as Error).message}`);
      throw new BadRequestException(`Stripe refund error: ${(error as Error).message}`);
    }
  }

  async createCustomer(params: {
    email?: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email: params.email,
        name: params.name,
        phone: params.phone,
        metadata: params.metadata,
      });

      this.logger.log(`Customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error(`Failed to create customer: ${(error as Error).message}`);
      throw new BadRequestException(`Stripe error: ${(error as Error).message}`);
    }
  }

  async retrieveCustomer(customerId: string): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
    try {
      return await this.stripe.customers.retrieve(customerId);
    } catch (error) {
      this.logger.error(`Failed to retrieve customer: ${(error as Error).message}`);
      throw new BadRequestException(`Stripe error: ${(error as Error).message}`);
    }
  }

  async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      this.logger.log(`PaymentMethod ${paymentMethodId} attached to customer ${customerId}`);
      return paymentMethod;
    } catch (error) {
      this.logger.error(`Failed to attach payment method: ${(error as Error).message}`);
      throw new BadRequestException(`Stripe error: ${(error as Error).message}`);
    }
  }

  async listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const methods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return methods.data;
    } catch (error) {
      this.logger.error(`Failed to list payment methods: ${(error as Error).message}`);
      throw new BadRequestException(`Stripe error: ${(error as Error).message}`);
    }
  }

  async constructWebhookEvent(payload: Buffer, signature: string): Promise<Stripe.Event> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${(error as Error).message}`);
      throw new BadRequestException(`Webhook error: ${(error as Error).message}`);
    }
  }

  extractPaymentDetails(paymentIntent: Stripe.PaymentIntent): {
    cardBrand?: string;
    cardLast4?: string;
    cardExp?: string;
    receiptUrl?: string;
  } {
    const result: {
      cardBrand?: string;
      cardLast4?: string;
      cardExp?: string;
      receiptUrl?: string;
    } = {};

    const charge = paymentIntent.latest_charge as Stripe.Charge | null;
    if (charge) {
      result.receiptUrl = charge.receipt_url || undefined;

      const paymentMethodDetails = charge.payment_method_details;
      if (paymentMethodDetails?.card) {
        result.cardBrand = paymentMethodDetails.card.brand || undefined;
        result.cardLast4 = paymentMethodDetails.card.last4 || undefined;
        if (paymentMethodDetails.card.exp_month && paymentMethodDetails.card.exp_year) {
          result.cardExp = `${paymentMethodDetails.card.exp_month.toString().padStart(2, '0')}/${paymentMethodDetails.card.exp_year}`;
        }
      }
    }

    return result;
  }
}
