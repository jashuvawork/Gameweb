import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { CREDIT_PACKS, SUBSCRIPTION_PLANS } from '@jashuva/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoreService {
  private stripe: Stripe | null = null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (key) this.stripe = new Stripe(key);
  }

  catalog() {
    return {
      subscriptions: SUBSCRIPTION_PLANS,
      credits: CREDIT_PACKS,
      cosmetics: [
        { id: 'theme-neon-cyan', name: 'Neon Cyan Theme', type: 'theme', priceCredits: 50 },
        { id: 'theme-void-gold', name: 'Void Gold Theme', type: 'theme', priceCredits: 80 },
        { id: 'skin-aurora', name: 'Aurora Avatar Frame', type: 'skin', priceCredits: 40 },
        { id: 'pet-spark', name: 'Spark Pet', type: 'pet', priceCredits: 120 },
        { id: 'anim-victory', name: 'Victory Burst', type: 'animation', priceCredits: 60 },
      ],
      note: 'NO PAY TO WIN — cosmetics, themes, skins, pets, and animations only.',
    };
  }

  async createCreditCheckout(userId: string, packId: string) {
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) throw new BadRequestException('Invalid pack');

    if (!this.stripe) {
      // Dev fallback: grant credits directly
      await this.prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: pack.credits + pack.bonus } },
      });
      await this.prisma.purchase.create({
        data: {
          userId,
          type: 'CREDIT_PURCHASE',
          amount: pack.price,
          credits: pack.credits + pack.bonus,
          metadata: { packId, mode: 'dev' },
        },
      });
      return { mode: 'dev', granted: pack.credits + pack.bonus };
    }

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });
      customerId = customer.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(pack.price * 100),
            product_data: {
              name: `${pack.credits + pack.bonus} JASHUVA Credits`,
              description: 'Unlock premium games & cosmetics. Not gambling. No pay-to-win.',
            },
          },
          quantity: 1,
        },
      ],
      metadata: { userId, packId, credits: String(pack.credits + pack.bonus) },
      success_url: `${this.config.get('APP_URL')}/store?success=1`,
      cancel_url: `${this.config.get('APP_URL')}/store?canceled=1`,
    });

    return { url: session.url, sessionId: session.id };
  }

  async createSubscriptionCheckout(userId: string, tier: string) {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.tier === tier);
    if (!plan || plan.tier === 'FREE') throw new BadRequestException('Invalid plan');

    const amount = plan.priceMonthly || plan.priceYearly;
    if (!this.stripe) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          subscription: tier as never,
          subscriptionEnds: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      return { mode: 'dev', tier };
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(amount * 100),
            recurring: { interval: plan.priceYearly ? 'year' : 'month' },
            product_data: { name: `JASHUVA ${plan.name}` },
          },
          quantity: 1,
        },
      ],
      metadata: { userId, tier },
      success_url: `${this.config.get('APP_URL')}/store?sub=1`,
      cancel_url: `${this.config.get('APP_URL')}/store?canceled=1`,
    });
    return { url: session.url };
  }

  async buyCosmetic(userId: string, itemId: string) {
    const catalog = this.catalog().cosmetics.find((c) => c.id === itemId);
    if (!catalog) throw new BadRequestException('Item not found');
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.credits < catalog.priceCredits) throw new BadRequestException('Insufficient credits');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: catalog.priceCredits } },
      }),
      this.prisma.inventoryItem.create({
        data: {
          userId,
          itemType: catalog.type,
          itemKey: catalog.id,
          metadata: { name: catalog.name },
        },
      }),
      this.prisma.purchase.create({
        data: {
          userId,
          type: 'CREDIT_SPEND',
          amount: 0,
          credits: -catalog.priceCredits,
          metadata: { itemId },
        },
      }),
    ]);
    return { ok: true };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe) return { received: true, mode: 'dev' };
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) throw new BadRequestException('Webhook not configured');
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, secret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId && session.metadata?.credits) {
        const credits = Number(session.metadata.credits);
        await this.prisma.user.update({
          where: { id: userId },
          data: { credits: { increment: credits } },
        });
        await this.prisma.purchase.create({
          data: {
            userId,
            type: 'CREDIT_PURCHASE',
            amount: (session.amount_total || 0) / 100,
            credits,
            stripePaymentId: session.payment_intent as string,
          },
        });
      }
      if (userId && session.metadata?.tier) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            subscription: session.metadata.tier as never,
            subscriptionEnds: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }
    return { received: true };
  }
}
