import { Body, Controller, Get, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { StoreService } from './store.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('store')
export class StoreController {
  constructor(private store: StoreService) {}

  @Get('catalog')
  catalog() {
    return this.store.catalog();
  }

  @Post('credits/checkout')
  @UseGuards(JwtAuthGuard)
  credits(@CurrentUser() user: { id: string }, @Body() body: { packId: string }) {
    return this.store.createCreditCheckout(user.id, body.packId);
  }

  @Post('subscriptions/checkout')
  @UseGuards(JwtAuthGuard)
  sub(@CurrentUser() user: { id: string }, @Body() body: { tier: string }) {
    return this.store.createSubscriptionCheckout(user.id, body.tier);
  }

  @Post('cosmetics/buy')
  @UseGuards(JwtAuthGuard)
  cosmetic(@CurrentUser() user: { id: string }, @Body() body: { itemId: string }) {
    return this.store.buyCosmetic(user.id, body.itemId);
  }

  @Post('webhooks/stripe')
  webhook(@Req() req: Request & { rawBody?: Buffer }, @Headers('stripe-signature') sig: string) {
    return this.store.handleWebhook(req.rawBody || Buffer.from(''), sig || '');
  }
}
