import { auth } from '@clerk/nextjs/server';
import { UserRepository } from '@/lib/repositories/userRepository';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await UserRepository.findByClerkId(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if subscription is expired
    const isExpired = UserRepository.isSubscriptionExpired(user);
    
    // Update status if expired
    if (isExpired && user.subscriptionStatus === 'active') {
      await UserRepository.update(userId, { subscriptionStatus: 'expired' });
    }

    const subscription = {
      plan: user.subscriptionPlan,
      status: isExpired && user.subscriptionStatus === 'active' ? 'expired' : user.subscriptionStatus,
      startDate: user.subscriptionStartDate?.toISOString() || '',
      endDate: user.subscriptionEndDate?.toISOString() || '',
    };

    const daysUntilExpiry = isExpired ? 0 : 
      user.subscriptionEndDate ? Math.ceil((new Date(user.subscriptionEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

    return NextResponse.json({
      subscription,
      purchaseHistory: [], // Will be implemented with billing history table later
      isExpired,
      daysUntilExpiry,
    });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, plan } = await request.json();

    const user = await UserRepository.findByClerkId(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'upgrade') {
      // Simulate payment success - in real app, this would be handled by Stripe webhooks
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      const updatedUser = await UserRepository.update(userId, {
        subscriptionPlan: plan,
        subscriptionStatus: 'active',
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
      });

      if (!updatedUser) {
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        subscription: {
          plan: updatedUser.subscriptionPlan,
          status: updatedUser.subscriptionStatus,
          startDate: updatedUser.subscriptionStartDate?.toISOString(),
          endDate: updatedUser.subscriptionEndDate?.toISOString(),
        },
        message: `Successfully upgraded to ${plan} plan!`,
      });
    } else if (action === 'cancel') {
      const updatedUser = await UserRepository.update(userId, {
        subscriptionStatus: 'cancelled',
      });

      if (!updatedUser) {
        return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        subscription: {
          plan: updatedUser.subscriptionPlan,
          status: updatedUser.subscriptionStatus,
          startDate: updatedUser.subscriptionStartDate?.toISOString(),
          endDate: updatedUser.subscriptionEndDate?.toISOString(),
        },
        message: 'Subscription cancelled successfully',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Subscription update error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}