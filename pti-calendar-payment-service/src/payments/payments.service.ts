import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Payment, PaymentStatus, PaymentMethod, PaymentType, Tarif, PromoCode } from '../domain/entities/payment.entity';
import { StripeService } from '../stripe/stripe.service';
import { KafkaProducerService } from '../infrastructure/kafka/kafka-producer.service';
import {
  CreatePaymentIntentDto,
  ConfirmPaymentDto,
  RecordCashPaymentDto,
  RefundPaymentDto,
  ValidatePromoCodeDto,
  CreateTarifDto,
  UpdateTarifDto,
  CreatePromoCodeDto,
  SearchPaymentsDto,
  PaymentIntentResponseDto,
  PromoCodeValidationResponseDto,
  PaymentStatsDto,
} from '../application/dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Tarif)
    private readonly tarifRepository: Repository<Tarif>,
    @InjectRepository(PromoCode)
    private readonly promoCodeRepository: Repository<PromoCode>,
    private readonly stripeService: StripeService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  // ===== PAYMENTS =====

  async createPaymentIntent(
    dto: CreatePaymentIntentDto,
    tenantId: string,
    centreId: string,
    userId?: string,
  ): Promise<PaymentIntentResponseDto> {
    // Créer le PaymentIntent Stripe
    const stripeIntent = await this.stripeService.createPaymentIntent({
      amount: dto.amount, // Already in cents
      currency: dto.currency || 'eur',
      description: dto.description || `RDV ${dto.rdv_id}`,
      metadata: {
        tenant_id: tenantId,
        rdv_id: dto.rdv_id,
        centre_id: centreId,
        ...dto.metadata,
      },
    });

    // Créer l'enregistrement Payment local
    const payment = this.paymentRepository.create({
      tenant_id: tenantId,
      rdv_id: dto.rdv_id,
      client_id: dto.client_id,
      centre_id: centreId,
      type: PaymentType.RDV,
      status: PaymentStatus.PENDING,
      amount: dto.amount / 100, // Store in euros
      currency: dto.currency || 'EUR',
      stripe_payment_intent_id: stripeIntent.id,
      description: dto.description,
      metadata: dto.metadata,
      created_by: userId,
    });

    await this.paymentRepository.save(payment);

    return {
      client_secret: stripeIntent.client_secret!,
      payment_intent_id: stripeIntent.id,
      payment_id: payment.id,
      amount: dto.amount,
      currency: dto.currency || 'EUR',
    };
  }

  async confirmPayment(dto: ConfirmPaymentDto, tenantId: string): Promise<Payment> {
    // Récupérer le payment local
    const payment = await this.paymentRepository.findOne({
      where: { stripe_payment_intent_id: dto.payment_intent_id, tenant_id: tenantId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Confirmer avec Stripe si besoin
    if (dto.payment_method_id) {
      await this.stripeService.confirmPaymentIntent(dto.payment_intent_id, dto.payment_method_id);
    }

    // Récupérer les détails mis à jour de Stripe
    const stripeIntent = await this.stripeService.retrievePaymentIntent(dto.payment_intent_id);

    // Mettre à jour le payment local
    payment.status = this.mapStripeStatus(stripeIntent.status);
    payment.method = PaymentMethod.CARD;
    payment.stripe_charge_id = stripeIntent.latest_charge as string || null as any;
    payment.stripe_payment_method_id = stripeIntent.payment_method as string;

    // Extraire les détails de la carte
    const cardDetails = this.stripeService.extractPaymentDetails(stripeIntent);
    payment.card_brand = cardDetails.cardBrand || null as any;
    payment.card_last4 = cardDetails.cardLast4 || null as any;
    payment.card_exp = cardDetails.cardExp || null as any;
    payment.receipt_url = cardDetails.receiptUrl || null as any;

    if (payment.status === PaymentStatus.SUCCEEDED) {
      payment.paid_at = new Date();

      // Calculer les montants HT/TVA
      const montantTTC = payment.amount;
      const tauxTVA = payment.taux_tva || 20;
      payment.montant_ht = montantTTC / (1 + tauxTVA / 100);
      payment.montant_tva = montantTTC - payment.montant_ht;
    }

    await this.paymentRepository.save(payment);

    // Émettre l'événement Kafka
    if (payment.status === PaymentStatus.SUCCEEDED) {
      await this.kafkaProducer.emit('payment.succeeded', {
        payment_id: payment.id,
        rdv_id: payment.rdv_id,
        tenant_id: tenantId,
        amount: payment.amount,
        method: payment.method,
      });
    }

    return payment;
  }

  async recordCashPayment(
    dto: RecordCashPaymentDto,
    tenantId: string,
    centreId: string,
    userId: string,
  ): Promise<Payment> {
    const payment = this.paymentRepository.create({
      tenant_id: tenantId,
      rdv_id: dto.rdv_id,
      centre_id: centreId,
      type: PaymentType.RDV,
      status: PaymentStatus.SUCCEEDED,
      method: dto.method as PaymentMethod,
      amount: dto.amount,
      currency: 'EUR',
      paid_at: new Date(),
      description: dto.notes,
      created_by: userId,
      metadata: dto.reference ? { reference: dto.reference } : undefined,
    });

    // Calculer les montants HT/TVA
    const tauxTVA = payment.taux_tva || 20;
    payment.montant_ht = payment.amount / (1 + tauxTVA / 100);
    payment.montant_tva = payment.amount - payment.montant_ht;

    await this.paymentRepository.save(payment);

    // Émettre l'événement
    await this.kafkaProducer.emit('payment.succeeded', {
      payment_id: payment.id,
      rdv_id: payment.rdv_id,
      tenant_id: tenantId,
      amount: payment.amount,
      method: payment.method,
    });

    return payment;
  }

  async refundPayment(
    paymentId: string,
    dto: RefundPaymentDto,
    tenantId: string,
    userId: string,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId, tenant_id: tenantId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new BadRequestException('Only succeeded payments can be refunded');
    }

    const refundAmount = dto.amount || payment.amount;
    if (refundAmount > payment.amount - payment.amount_refunded) {
      throw new BadRequestException('Refund amount exceeds available amount');
    }

    // Remboursement Stripe si paiement par carte
    if (payment.stripe_payment_intent_id) {
      const refund = await this.stripeService.createRefund({
        paymentIntentId: payment.stripe_payment_intent_id,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: 'requested_by_customer',
      });
      payment.stripe_refund_id = refund.id;
    }

    // Mettre à jour le payment
    payment.amount_refunded = (payment.amount_refunded || 0) + refundAmount;
    payment.refund_reason = dto.reason;
    payment.refunded_at = new Date();

    if (payment.amount_refunded >= payment.amount) {
      payment.status = PaymentStatus.REFUNDED;
    } else {
      payment.status = PaymentStatus.PARTIALLY_REFUNDED;
    }

    await this.paymentRepository.save(payment);

    // Émettre l'événement
    await this.kafkaProducer.emit('payment.refunded', {
      payment_id: payment.id,
      rdv_id: payment.rdv_id,
      tenant_id: tenantId,
      refund_amount: refundAmount,
      reason: dto.reason,
    });

    return payment;
  }

  async findById(id: string, tenantId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async findByRdvId(rdvId: string, tenantId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { rdv_id: rdvId, tenant_id: tenantId },
      order: { created_at: 'DESC' },
    });
  }

  async search(query: SearchPaymentsDto, tenantId: string) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.tenant_id = :tenantId', { tenantId });

    if (query.centre_id) {
      queryBuilder.andWhere('payment.centre_id = :centreId', { centreId: query.centre_id });
    }

    if (query.client_id) {
      queryBuilder.andWhere('payment.client_id = :clientId', { clientId: query.client_id });
    }

    if (query.status) {
      queryBuilder.andWhere('payment.status = :status', { status: query.status });
    }

    if (query.date_debut && query.date_fin) {
      queryBuilder.andWhere('payment.created_at BETWEEN :dateDebut AND :dateFin', {
        dateDebut: query.date_debut,
        dateFin: query.date_fin,
      });
    }

    queryBuilder.orderBy('payment.created_at', 'DESC');

    const [items, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getStats(
    centreId: string,
    dateDebut: string,
    dateFin: string,
    tenantId: string,
  ): Promise<PaymentStatsDto> {
    const payments = await this.paymentRepository.find({
      where: {
        tenant_id: tenantId,
        centre_id: centreId,
        created_at: Between(new Date(dateDebut), new Date(dateFin)),
      },
    });

    const byStatus: Record<PaymentStatus, number> = {
      [PaymentStatus.PENDING]: 0,
      [PaymentStatus.PROCESSING]: 0,
      [PaymentStatus.SUCCEEDED]: 0,
      [PaymentStatus.FAILED]: 0,
      [PaymentStatus.CANCELLED]: 0,
      [PaymentStatus.REFUNDED]: 0,
      [PaymentStatus.PARTIALLY_REFUNDED]: 0,
    };

    const byMethod: Record<string, number> = {};
    let totalAmount = 0;
    let totalRefunded = 0;

    for (const payment of payments) {
      byStatus[payment.status]++;
      if (payment.method) {
        byMethod[payment.method] = (byMethod[payment.method] || 0) + 1;
      }
      if (payment.status === PaymentStatus.SUCCEEDED) {
        totalAmount += Number(payment.amount);
        totalRefunded += Number(payment.amount_refunded || 0);
      }
    }

    return {
      total_payments: payments.length,
      total_amount: totalAmount,
      total_refunded: totalRefunded,
      net_revenue: totalAmount - totalRefunded,
      by_status: byStatus,
      by_method: byMethod as any,
    };
  }

  // ===== TARIFS =====

  async getTarif(
    centreId: string,
    typeControle: string,
    typeVehicule: string,
    carburant: string | null,
    tenantId: string,
  ): Promise<Tarif | null> {
    // Chercher d'abord un tarif spécifique au centre
    let tarif = await this.tarifRepository.findOne({
      where: {
        tenant_id: tenantId,
        centre_id: centreId,
        type_controle: typeControle,
        type_vehicule: typeVehicule,
        carburant: carburant || undefined,
        actif: true,
      },
    });

    // Si pas trouvé, chercher le tarif par défaut du réseau
    if (!tarif) {
      tarif = await this.tarifRepository.findOne({
        where: {
          tenant_id: tenantId,
          centre_id: null as any,
          type_controle: typeControle,
          type_vehicule: typeVehicule,
          actif: true,
        },
      });
    }

    return tarif;
  }

  async createTarif(dto: CreateTarifDto, tenantId: string): Promise<Tarif> {
    // Calculer le prix TTC
    const tauxTVA = dto.taux_tva || 20;
    const prixTTC = dto.prix_ht * (1 + tauxTVA / 100);

    const tarif = this.tarifRepository.create({
      tenant_id: tenantId,
      ...dto,
      prix_ttc: Math.round(prixTTC * 100) / 100,
    });

    return this.tarifRepository.save(tarif);
  }

  async updateTarif(id: string, dto: UpdateTarifDto, tenantId: string): Promise<Tarif> {
    const tarif = await this.tarifRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!tarif) {
      throw new NotFoundException('Tarif not found');
    }

    Object.assign(tarif, dto);

    // Recalculer le prix TTC si le HT ou la TVA change
    if (dto.prix_ht !== undefined || dto.taux_tva !== undefined) {
      const prixHT = dto.prix_ht ?? tarif.prix_ht;
      const tauxTVA = dto.taux_tva ?? tarif.taux_tva;
      tarif.prix_ttc = Math.round(prixHT * (1 + tauxTVA / 100) * 100) / 100;
    }

    return this.tarifRepository.save(tarif);
  }

  async listTarifs(centreId: string | null, tenantId: string): Promise<Tarif[]> {
    const where: any = { tenant_id: tenantId, actif: true };
    if (centreId) {
      where.centre_id = centreId;
    }

    return this.tarifRepository.find({
      where,
      order: { type_controle: 'ASC', type_vehicule: 'ASC' },
    });
  }

  // ===== PROMO CODES =====

  async validatePromoCode(
    dto: ValidatePromoCodeDto,
    tenantId: string,
  ): Promise<PromoCodeValidationResponseDto> {
    const code = await this.promoCodeRepository.findOne({
      where: { tenant_id: tenantId, code: dto.code.toUpperCase(), actif: true },
    });

    if (!code) {
      return {
        valid: false,
        code: dto.code,
        discount_type: '',
        discount_value: 0,
        discount_amount: 0,
        final_amount: dto.montant_initial,
        error_message: 'Code promo invalide',
      };
    }

    // Vérifier la validité temporelle
    const now = new Date().toISOString().split('T')[0];
    if (code.valid_from && code.valid_from > now) {
      return {
        valid: false,
        code: dto.code,
        discount_type: code.type,
        discount_value: Number(code.value),
        discount_amount: 0,
        final_amount: dto.montant_initial,
        error_message: 'Ce code n\'est pas encore valide',
      };
    }
    if (code.valid_until && code.valid_until < now) {
      return {
        valid: false,
        code: dto.code,
        discount_type: code.type,
        discount_value: Number(code.value),
        discount_amount: 0,
        final_amount: dto.montant_initial,
        error_message: 'Ce code a expiré',
      };
    }

    // Vérifier les utilisations
    if (code.max_uses && code.current_uses >= code.max_uses) {
      return {
        valid: false,
        code: dto.code,
        discount_type: code.type,
        discount_value: Number(code.value),
        discount_amount: 0,
        final_amount: dto.montant_initial,
        error_message: 'Ce code a atteint son nombre maximum d\'utilisations',
      };
    }

    // Vérifier le montant minimum
    if (code.min_amount && dto.montant_initial < Number(code.min_amount)) {
      return {
        valid: false,
        code: dto.code,
        discount_type: code.type,
        discount_value: Number(code.value),
        discount_amount: 0,
        final_amount: dto.montant_initial,
        error_message: `Montant minimum requis: ${code.min_amount}€`,
      };
    }

    // Vérifier les restrictions
    if (code.applicable_centres?.length > 0 && !code.applicable_centres.includes(dto.centre_id)) {
      return {
        valid: false,
        code: dto.code,
        discount_type: code.type,
        discount_value: Number(code.value),
        discount_amount: 0,
        final_amount: dto.montant_initial,
        error_message: 'Ce code n\'est pas valide pour ce centre',
      };
    }

    if (code.applicable_type_controle?.length > 0 && !code.applicable_type_controle.includes(dto.type_controle)) {
      return {
        valid: false,
        code: dto.code,
        discount_type: code.type,
        discount_value: Number(code.value),
        discount_amount: 0,
        final_amount: dto.montant_initial,
        error_message: 'Ce code n\'est pas valide pour ce type de contrôle',
      };
    }

    // Calculer la réduction
    let discountAmount = 0;
    if (code.type === 'PERCENTAGE') {
      discountAmount = dto.montant_initial * (Number(code.value) / 100);
    } else {
      discountAmount = Number(code.value);
    }

    // Appliquer le plafond de réduction
    if (code.max_discount && discountAmount > Number(code.max_discount)) {
      discountAmount = Number(code.max_discount);
    }

    // Ne pas dépasser le montant initial
    if (discountAmount > dto.montant_initial) {
      discountAmount = dto.montant_initial;
    }

    return {
      valid: true,
      code: dto.code,
      discount_type: code.type,
      discount_value: Number(code.value),
      discount_amount: Math.round(discountAmount * 100) / 100,
      final_amount: Math.round((dto.montant_initial - discountAmount) * 100) / 100,
    };
  }

  async usePromoCode(code: string, tenantId: string): Promise<void> {
    await this.promoCodeRepository
      .createQueryBuilder()
      .update(PromoCode)
      .set({ current_uses: () => 'current_uses + 1' })
      .where('tenant_id = :tenantId AND code = :code', { tenantId, code: code.toUpperCase() })
      .execute();
  }

  async createPromoCode(dto: CreatePromoCodeDto, tenantId: string): Promise<PromoCode> {
    // Vérifier l'unicité du code
    const existing = await this.promoCodeRepository.findOne({
      where: { tenant_id: tenantId, code: dto.code.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException('Un code promo avec ce code existe déjà');
    }

    const promoCode = this.promoCodeRepository.create({
      tenant_id: tenantId,
      ...dto,
      code: dto.code.toUpperCase(),
    });

    return this.promoCodeRepository.save(promoCode);
  }

  async listPromoCodes(tenantId: string, activeOnly = true): Promise<PromoCode[]> {
    const where: any = { tenant_id: tenantId };
    if (activeOnly) {
      where.actif = true;
    }

    return this.promoCodeRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  // ===== WEBHOOK HANDLING =====

  async handleStripeWebhook(event: any): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object);
        break;
    }
  }

  private async handlePaymentSucceeded(paymentIntent: any): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { stripe_payment_intent_id: paymentIntent.id },
    });

    if (!payment || payment.status === PaymentStatus.SUCCEEDED) {
      return;
    }

    payment.status = PaymentStatus.SUCCEEDED;
    payment.paid_at = new Date();

    const cardDetails = this.stripeService.extractPaymentDetails(paymentIntent);
    payment.card_brand = cardDetails.cardBrand || null as any;
    payment.card_last4 = cardDetails.cardLast4 || null as any;
    payment.card_exp = cardDetails.cardExp || null as any;
    payment.receipt_url = cardDetails.receiptUrl || null as any;

    await this.paymentRepository.save(payment);

    await this.kafkaProducer.emit('payment.succeeded', {
      payment_id: payment.id,
      rdv_id: payment.rdv_id,
      tenant_id: payment.tenant_id,
      amount: payment.amount,
    });
  }

  private async handlePaymentFailed(paymentIntent: any): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { stripe_payment_intent_id: paymentIntent.id },
    });

    if (!payment) {
      return;
    }

    payment.status = PaymentStatus.FAILED;
    payment.error_code = paymentIntent.last_payment_error?.code;
    payment.error_message = paymentIntent.last_payment_error?.message;

    await this.paymentRepository.save(payment);

    await this.kafkaProducer.emit('payment.failed', {
      payment_id: payment.id,
      rdv_id: payment.rdv_id,
      tenant_id: payment.tenant_id,
      error: payment.error_message,
    });
  }

  private async handleChargeRefunded(charge: any): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { stripe_charge_id: charge.id },
    });

    if (!payment) {
      return;
    }

    payment.amount_refunded = charge.amount_refunded / 100;
    payment.status = charge.refunded ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;
    payment.refunded_at = new Date();

    await this.paymentRepository.save(payment);
  }

  private mapStripeStatus(stripeStatus: string): PaymentStatus {
    switch (stripeStatus) {
      case 'succeeded':
        return PaymentStatus.SUCCEEDED;
      case 'processing':
        return PaymentStatus.PROCESSING;
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        return PaymentStatus.PENDING;
      case 'canceled':
        return PaymentStatus.CANCELLED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
