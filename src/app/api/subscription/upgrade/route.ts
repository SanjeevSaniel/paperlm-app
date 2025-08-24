import { auth } from '@clerk/nextjs/server';
import { UserRepository } from '@/lib/repositories/userRepository';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, billing } = await request.json();
    
    // Validate input
    if (plan !== 'pro' || !['monthly', 'yearly'].includes(billing)) {
      return NextResponse.json({ error: 'Invalid plan or billing cycle' }, { status: 400 });
    }

    // Get current user
    const user = await UserRepository.findByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate dates and pricing
    const startDate = new Date();
    const endDate = new Date();
    
    const pricing = {
      monthly: { amount: 1900, months: 1 }, // $19/month
      yearly: { amount: 15000, months: 12 }, // $15/month billed yearly ($180/year)
    };

    const selectedPricing = pricing[billing];
    endDate.setMonth(endDate.getMonth() + selectedPricing.months);

    try {
      // For now, simulate successful payment
      // In production, this would integrate with Stripe, Razorpay, etc.
      
      // Update user subscription
      const updatedUser = await UserRepository.update(userId, {
        subscriptionPlan: 'pro',
        subscriptionStatus: 'active',
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
      });

      if (!updatedUser) {
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully upgraded to Pro (${billing})!`,
        subscription: {
          plan: 'pro',
          status: 'active',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          billing,
          amount: selectedPricing.amount,
        },
        // In production, return checkout URL for payment gateway
        checkoutUrl: null, 
      });
    } catch (error) {
      console.error('Payment processing error:', error);
      return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Upgrade error:', error);
    return NextResponse.json(
      { error: 'Failed to process upgrade' },
      { status: 500 }
    );
  }
}