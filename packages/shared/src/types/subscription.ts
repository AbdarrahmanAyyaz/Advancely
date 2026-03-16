export type SubscriptionPlan = 'free' | 'pro_monthly' | 'pro_yearly';
export type SubscriptionStatus = 'active' | 'trialing' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  userId: string;
  rcCustomerId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}
