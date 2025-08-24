import { UserRepository } from '@/lib/repositories/userRepository';
import { UserTrackingRepository } from '@/lib/repositories/userTrackingRepository';
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
    if (eventType === 'user.created') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      
      console.log('🔥 User signup detected:', id);

      const user = await UserRepository.getOrCreate(
        id,
        email_addresses[0]?.email_address || `${id}@placeholder.local`,
        {
          firstName: first_name || null,
          lastName: last_name || null,
          profileImageUrl: image_url || null,
          emailVerified: email_addresses[0]?.verification?.status === 'verified' || false,
          lastLoginAt: new Date(),
        }
      );

      if (user) {
        console.log('✅ User created in NeonDB:', id, user.email);
        // Track user signup
        await UserTrackingRepository.trackUserSignin(user.id);
        console.log('🎉 User signup tracked');
      } else {
        console.error('❌ Failed to create user in NeonDB:', id);
      }
    }

    if (eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;

      console.log('🔄 User update detected:', id);

      const updatedUser = await UserRepository.update(id, {
        email: email_addresses[0]?.email_address || `${id}@placeholder.local`,
        firstName: first_name || null,
        lastName: last_name || null,
        profileImageUrl: image_url || null,
        emailVerified: email_addresses[0]?.verification?.status === 'verified' || false,
      });

      if (updatedUser) {
        console.log('✅ User updated in NeonDB:', id, updatedUser.email);
      } else {
        console.error('❌ Failed to update user in NeonDB:', id);
      }
    }

    if (eventType === 'user.deleted') {
      const { id } = evt.data;

      console.log('🗑️ User deletion detected:', id);

      // Note: We may want to soft-delete or keep user data for compliance
      // For now, we'll just log this event
      console.log('User deletion logged for:', id);
    }

    if (eventType === 'session.created') {
      const { user_id } = evt.data;
      console.log('🔐 User signin detected:', user_id);
      
      // Update last login time and track signin
      if (user_id) {
        await UserRepository.update(user_id as string, {
          lastLoginAt: new Date(),
        });
        
        // Also track in user tracking system
        const user = await UserRepository.findByClerkId(user_id as string);
        if (user) {
          await UserTrackingRepository.trackUserSignin(user.id);
        }
        
        console.log('✅ User signin tracked for:', user_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    );
  }
}
