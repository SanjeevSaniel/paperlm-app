import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if subscription is expired
    const isExpired = user.isSubscriptionExpired();
    
    if (isExpired && user.subscription.status === 'active') {
      user.subscription.status = 'expired';
      await user.save();
    }

    return NextResponse.json({
      subscription: user.subscription,
      purchaseHistory: user.purchaseHistory,
      isExpired,
      daysUntilExpiry: isExpired ? 0 : Math.ceil((user.subscription.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
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

    await connectDB();
    
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'upgrade') {
      // Simulate payment success - in real app, this would be handled by Stripe webhooks
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      user.subscription.plan = plan;
      user.subscription.status = 'active';
      user.subscription.startDate = startDate;
      user.subscription.endDate = endDate;

      // Add to purchase history
      user.purchaseHistory.push({
        id: `purchase_${Date.now()}`,
        plan: plan,
        amount: plan === 'pro' ? 900 : 0, // $9.00 in cents
        currency: 'usd',
        status: 'completed',
        purchaseDate: startDate,
        validUntil: endDate,
      });

      await user.save();

      return NextResponse.json({
        success: true,
        subscription: user.subscription,
        message: `Successfully upgraded to ${plan} plan!`,
      });
    } else if (action === 'cancel') {
      user.subscription.status = 'cancelled';
      await user.save();

      return NextResponse.json({
        success: true,
        subscription: user.subscription,
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