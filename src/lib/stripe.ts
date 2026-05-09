import Stripe from 'stripe';
import { config } from '@/core/config';

if (!config.stripe.secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not defined in the environment variables');
}

export const stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: '2025-01-27.acacia' as any, // Using a stable version
});
