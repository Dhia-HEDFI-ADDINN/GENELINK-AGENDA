import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Headers,
  ParseUUIDPipe,
  RawBodyRequest,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { StripeService } from '../stripe/stripe.service';
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
  PaymentResponseDto,
  TarifResponseDto,
  PromoCodeValidationResponseDto,
  PaymentStatsDto,
} from '../application/dto/payment.dto';

@ApiTags('payments')
@Controller('payments')
@ApiBearerAuth()
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('intent')
  @ApiOperation({ summary: 'Créer un PaymentIntent Stripe' })
  @ApiResponse({ status: 201, type: PaymentIntentResponseDto })
  async createPaymentIntent(
    @Body() dto: CreatePaymentIntentDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-centre-id') centreId: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.paymentsService.createPaymentIntent(dto, tenantId, centreId, userId);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirmer un paiement' })
  @ApiResponse({ status: 200, type: PaymentResponseDto })
  async confirmPayment(
    @Body() dto: ConfirmPaymentDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.paymentsService.confirmPayment(dto, tenantId);
  }

  @Post('cash')
  @ApiOperation({ summary: 'Enregistrer un paiement en espèces/chèque' })
  @ApiResponse({ status: 201, type: PaymentResponseDto })
  async recordCashPayment(
    @Body() dto: RecordCashPaymentDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-centre-id') centreId: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.paymentsService.recordCashPayment(dto, tenantId, centreId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Rechercher des paiements' })
  async search(
    @Query() query: SearchPaymentsDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.paymentsService.search(query, tenantId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtenir les statistiques de paiement' })
  @ApiQuery({ name: 'centre_id', required: true })
  @ApiQuery({ name: 'date_debut', required: true })
  @ApiQuery({ name: 'date_fin', required: true })
  @ApiResponse({ status: 200, type: PaymentStatsDto })
  async getStats(
    @Query('centre_id') centreId: string,
    @Query('date_debut') dateDebut: string,
    @Query('date_fin') dateFin: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.paymentsService.getStats(centreId, dateDebut, dateFin, tenantId);
  }

  @Get('rdv/:rdvId')
  @ApiOperation({ summary: 'Obtenir les paiements d\'un RDV' })
  @ApiParam({ name: 'rdvId', type: String })
  async getByRdv(
    @Param('rdvId', ParseUUIDPipe) rdvId: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.paymentsService.findByRdvId(rdvId, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un paiement par ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: PaymentResponseDto })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.paymentsService.findById(id, tenantId);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Rembourser un paiement' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: PaymentResponseDto })
  async refund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefundPaymentDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.paymentsService.refundPayment(id, dto, tenantId, userId);
  }

  // ===== TARIFS =====

  @Get('tarifs/calculate')
  @ApiOperation({ summary: 'Obtenir le tarif pour un contrôle' })
  @ApiQuery({ name: 'centre_id', required: true })
  @ApiQuery({ name: 'type_controle', required: true })
  @ApiQuery({ name: 'type_vehicule', required: true })
  @ApiQuery({ name: 'carburant', required: false })
  @ApiResponse({ status: 200, type: TarifResponseDto })
  async getTarif(
    @Query('centre_id') centreId: string,
    @Query('type_controle') typeControle: string,
    @Query('type_vehicule') typeVehicule: string,
    @Query('carburant') carburant: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.paymentsService.getTarif(centreId, typeControle, typeVehicule, carburant, tenantId);
  }

  @Get('tarifs')
  @ApiOperation({ summary: 'Lister les tarifs' })
  @ApiQuery({ name: 'centre_id', required: false })
  @ApiResponse({ status: 200, type: [TarifResponseDto] })
  async listTarifs(
    @Query('centre_id') centreId: string,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.paymentsService.listTarifs(centreId, tenantId);
  }

  @Post('tarifs')
  @ApiOperation({ summary: 'Créer un tarif' })
  @ApiResponse({ status: 201, type: TarifResponseDto })
  async createTarif(
    @Body() dto: CreateTarifDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.paymentsService.createTarif(dto, tenantId);
  }

  @Put('tarifs/:id')
  @ApiOperation({ summary: 'Mettre à jour un tarif' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: TarifResponseDto })
  async updateTarif(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTarifDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.paymentsService.updateTarif(id, dto, tenantId);
  }

  // ===== PROMO CODES =====

  @Post('promo/validate')
  @ApiOperation({ summary: 'Valider un code promo' })
  @ApiResponse({ status: 200, type: PromoCodeValidationResponseDto })
  async validatePromoCode(
    @Body() dto: ValidatePromoCodeDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.paymentsService.validatePromoCode(dto, tenantId);
  }

  @Get('promo')
  @ApiOperation({ summary: 'Lister les codes promo' })
  @ApiQuery({ name: 'active_only', required: false, type: Boolean })
  async listPromoCodes(
    @Query('active_only') activeOnly: boolean,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.paymentsService.listPromoCodes(tenantId, activeOnly !== false);
  }

  @Post('promo')
  @ApiOperation({ summary: 'Créer un code promo' })
  async createPromoCode(
    @Body() dto: CreatePromoCodeDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.paymentsService.createPromoCode(dto, tenantId);
  }

  // ===== WEBHOOK =====

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook Stripe' })
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const event = await this.stripeService.constructWebhookEvent(
      req.rawBody!,
      signature,
    );
    await this.paymentsService.handleStripeWebhook(event);
    return { received: true };
  }
}
