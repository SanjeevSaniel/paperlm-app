import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
      id: string;
    }>;
    first_name?: string;
    last_name?: string;
    [key: string]: unknown;
  };
}

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    throw new Error(
      'Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local',
    );
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(webhookSecret);

  let evt: ClerkWebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  try {
    await connectDB();

    if (eventType === 'user.created') {
      const { id, email_addresses, first_name, last_name } = evt.data;

      const user = new User({
        clerkId: id,
        email: email_addresses[0]?.email_address || '',
        firstName: first_name,
        lastName: last_name,
      });

      await user.save();
      console.log('User created in MongoDB:', id);
    }

    if (eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name } = evt.data;

      await User.findOneAndUpdate(
        { clerkId: id },
        {
          email: email_addresses[0]?.email_address || '',
          firstName: first_name,
          lastName: last_name,
        },
        { upsert: true },
      );

      console.log('User updated in MongoDB:', id);
    }

    if (eventType === 'user.deleted') {
      const { id } = evt.data;

      await User.findOneAndDelete({ clerkId: id });
      console.log('User deleted from MongoDB:', id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    );
  }
}
