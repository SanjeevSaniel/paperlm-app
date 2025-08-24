import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useUser } from '@clerk/nextjs';

interface UserData {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  subscription: {
    plan: 'free' | 'pro';
    status: 'active' | 'expired' | 'cancelled';
    startDate: Date;
    endDate: Date;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  usage: {
    documentsUploaded: number;
    messagesUsed: number;
    lastResetDate: Date;
  };
  canUploadDocument: boolean;
  canSendMessage: boolean;
  isSubscriptionExpired: boolean;
  hasCompletedOnboarding: boolean;
  needsOnboarding: boolean;
  onboardingCompletedAt?: Date;
  paperlmUserId?: string;
}

interface AuthState {
  // User data
  user: UserData | null;
  paperlmUserId: string | null;
  isLoading: boolean;
  error: string | null;

  // Authentication state
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoggingOut: boolean;

  // Actions
  setUser: (user: UserData | null) => void;
  setPaperlmUserId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setLoggingOut: (loggingOut: boolean) => void;

  // API methods
  fetchUserData: () => Promise<void>;
  incrementDocumentUsage: () => Promise<boolean>;
  incrementMessageUsage: () => Promise<boolean>;
  completeOnboarding: () => Promise<boolean>;
  updateUserProfile: (data: Partial<UserData>) => Promise<void>;

  // Reset
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        paperlmUserId: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
        isInitialized: false,
        isLoggingOut: false,

        // Setters
        setUser: (user) => set({ user }),
        setPaperlmUserId: (paperlmUserId) => set({ paperlmUserId }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
        setInitialized: (isInitialized) => set({ isInitialized }),

        // Fetch user data from API
        fetchUserData: async () => {
          const {
            setLoading,
            setError,
            setUser,
            setAuthenticated,
            setInitialized,
          } = get();

          try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/user');

            if (!response.ok) {
              if (response.status === 401) {
                // User not authenticated
                setUser(null);
                setAuthenticated(false);
                return;
              }
              throw new Error(
                `HTTP ${response.status}: ${response.statusText}`,
              );
            }

            const data = await response.json();

            setUser(data.user);
            setAuthenticated(true);
          } catch (error) {
            console.error('Error fetching user data:', error);
            setError(
              error instanceof Error
                ? error.message
                : 'Failed to fetch user data',
            );
            setUser(null);
            setAuthenticated(false);
          } finally {
            setLoading(false);
            setInitialized(true);
          }
        },

        // Increment document usage
        incrementDocumentUsage: async (): Promise<boolean> => {
          const { setError, setUser, user } = get();

          try {
            setError(null);

            const response = await fetch('/api/user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ action: 'increment_document' }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                errorData.error || 'Failed to increment document usage',
              );
            }

            const data = await response.json();

            // Update user data with new usage
            if (user) {
              setUser({
                ...user,
                usage: data.usage,
                canUploadDocument: data.canUploadDocument,
                canSendMessage: data.canSendMessage,
              });
            }

            return true;
          } catch (error) {
            console.error('Error incrementing document usage:', error);
            setError(
              error instanceof Error
                ? error.message
                : 'Failed to increment document usage',
            );
            return false;
          }
        },

        // Increment message usage
        incrementMessageUsage: async (): Promise<boolean> => {
          const { setError, setUser, user } = get();

          try {
            setError(null);

            const response = await fetch('/api/user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ action: 'increment_message' }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                errorData.error || 'Failed to increment message usage',
              );
            }

            const data = await response.json();

            // Update user data with new usage
            if (user) {
              setUser({
                ...user,
                usage: data.usage,
                canUploadDocument: data.canUploadDocument,
                canSendMessage: data.canSendMessage,
              });
            }

            return true;
          } catch (error) {
            console.error('Error incrementing message usage:', error);
            setError(
              error instanceof Error
                ? error.message
                : 'Failed to increment message usage',
            );
            return false;
          }
        },

        // Complete onboarding
        completeOnboarding: async (): Promise<boolean> => {
          const { setError, setUser, user } = get();

          try {
            setError(null);

            const response = await fetch('/api/user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ action: 'complete_onboarding' }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                errorData.error || 'Failed to complete onboarding',
              );
            }

            // Update user data with new onboarding state
            if (user) {
              setUser({
                ...user,
                hasCompletedOnboarding: true,
                needsOnboarding: false,
                onboardingCompletedAt: new Date(),
              });
            }

            return true;
          } catch (error) {
            console.error('Error completing onboarding:', error);
            setError(
              error instanceof Error
                ? error.message
                : 'Failed to complete onboarding',
            );
            return false;
          }
        },

        // Update user profile
        updateUserProfile: async (profileData: Partial<UserData>) => {
          const { setError, setUser, user } = get();

          try {
            setError(null);

            // For now, just update local state
            // Later, you can add an API endpoint to update profile
            if (user) {
              setUser({ ...user, ...profileData });
            }
          } catch (error) {
            console.error('Error updating user profile:', error);
            setError(
              error instanceof Error
                ? error.message
                : 'Failed to update profile',
            );
          }
        },

        // Reset state
        reset: () =>
          set({
            user: null,
            paperlmUserId: null,
            isLoading: false,
            error: null,
            isAuthenticated: false,
            isInitialized: false,
          }),
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          paperlmUserId: state.paperlmUserId,
          isAuthenticated: state.isAuthenticated,
        }),
      },
    ),
    {
      name: 'auth-store',
    },
  ),
);

// Hook to combine Clerk user data with our auth store
export const useAuthData = () => {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const authStore = useAuthStore();

  return {
    // Clerk data
    clerkUser,
    clerkLoaded,
    isSignedIn,
    
    // Our store data
    ...authStore,
    
    // Combined status
    isFullyLoaded: clerkLoaded && authStore.isInitialized,
    displayName: clerkUser?.fullName || clerkUser?.firstName || authStore.user?.firstName || 'User',
    email: clerkUser?.emailAddresses?.[0]?.emailAddress || authStore.user?.email || '',
  };
};