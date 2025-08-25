import { auth } from '@clerk/nextjs/server';
import { UserRepository } from '@/lib/repositories/userRepository';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { theme, language, timezone, emailNotifications, pushNotifications } = await request.json();
    
    // Get current user to merge preferences
    const currentUser = await UserRepository.findByClerkId(userId);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Merge with existing preferences
    const currentPreferences = currentUser.preferences || {};
    const updatedPreferences = {
      ...currentPreferences,
      theme: theme || currentPreferences.theme || 'system',
      language: language || currentPreferences.language || 'en',
      timezone: timezone || currentPreferences.timezone || 'UTC',
      notifications: {
        ...currentPreferences.notifications,
        email: emailNotifications !== undefined ? emailNotifications : currentPreferences.notifications?.email || false,
        browser: pushNotifications !== undefined ? pushNotifications : currentPreferences.notifications?.browser || true,
        usageWarnings: currentPreferences.notifications?.usageWarnings !== false, // Default to true
      }
    };

    // Update user preferences
    const updatedUser = await UserRepository.update(userId, {
      preferences: updatedPreferences,
    });
    
    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updatedUser.preferences
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}