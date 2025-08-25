import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface UserMenuState {
  isOpen: boolean
  activeSection: string
  setIsOpen: (isOpen: boolean) => void
  setActiveSection: (section: string) => void
  closeMenu: () => void
}

interface ProfileFormData {
  firstName: string
  lastName: string
  email: string
  bio: string
}

interface ProfileFormState {
  formData: ProfileFormData
  isEditing: boolean
  hasChanges: boolean
  setFormData: (data: Partial<ProfileFormData>) => void
  setIsEditing: (isEditing: boolean) => void
  setHasChanges: (hasChanges: boolean) => void
  resetForm: () => void
  saveForm: () => Promise<void>
}

export const useUserMenuStore = create<UserMenuState>()(
  devtools(
    (set) => ({
      isOpen: false,
      activeSection: 'profile',
      setIsOpen: (isOpen) => set({ isOpen }),
      setActiveSection: (section) => set({ activeSection: section }),
      closeMenu: () => set({ isOpen: false, activeSection: 'profile' }),
    }),
    {
      name: 'user-menu-store',
    }
  )
)

export const useProfileFormStore = create<ProfileFormState>()(
  devtools(
    persist(
      (set, get) => ({
        formData: {
          firstName: '',
          lastName: '',
          email: '',
          bio: '',
        },
        isEditing: false,
        hasChanges: false,
        setFormData: (data) =>
          set((state) => ({
            formData: { ...state.formData, ...data },
            hasChanges: true,
          })),
        setIsEditing: (isEditing) => set({ isEditing }),
        setHasChanges: (hasChanges) => set({ hasChanges }),
        resetForm: () =>
          set({
            formData: {
              firstName: '',
              lastName: '',
              email: '',
              bio: '',
            },
            hasChanges: false,
            isEditing: false,
          }),
        saveForm: async () => {
          const { formData } = get()
          try {
            console.log('Saving profile data:', formData)
            
            // Update profile via API
            const response = await fetch('/api/user/profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                firstName: formData.firstName,
                lastName: formData.lastName,
                bio: formData.bio,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to save profile');
            }

            const result = await response.json();
            console.log('✅ Profile saved successfully:', result);
            
            set({ hasChanges: false, isEditing: false })
          } catch (error) {
            console.error('❌ Error saving profile:', error)
            throw error
          }
        },
      }),
      {
        name: 'profile-form-storage',
        partialize: (state) => ({ formData: state.formData }),
      }
    ),
    {
      name: 'profile-form-store',
    }
  )
)

interface AppPreferencesState {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  emailNotifications: boolean
  pushNotifications: boolean
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setLanguage: (language: string) => void
  setTimezone: (timezone: string) => void
  setEmailNotifications: (enabled: boolean) => void
  setPushNotifications: (enabled: boolean) => void
  savePreferences: () => Promise<void>
}

export const useAppPreferencesStore = create<AppPreferencesState>()(
  devtools(
    persist(
      (set, get) => ({
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        setTheme: (theme) => {
          set({ theme });
          // Apply theme to document
          const root = document.documentElement;
          if (theme === 'dark') {
            root.classList.add('dark');
          } else if (theme === 'light') {
            root.classList.remove('dark');
          } else {
            // System theme
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            if (mediaQuery.matches) {
              root.classList.add('dark');
            } else {
              root.classList.remove('dark');
            }
          }
        },
        setLanguage: (language) => set({ language }),
        setTimezone: (timezone) => set({ timezone }),
        setEmailNotifications: (emailNotifications) => set({ emailNotifications }),
        setPushNotifications: (pushNotifications) => set({ pushNotifications }),
        savePreferences: async () => {
          const { theme, language, timezone, emailNotifications, pushNotifications } = get();
          try {
            const response = await fetch('/api/user/preferences', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                theme,
                language,
                timezone,
                emailNotifications,
                pushNotifications,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to save preferences');
            }

            const result = await response.json();
            console.log('✅ Preferences saved successfully:', result);
          } catch (error) {
            console.error('❌ Error saving preferences:', error);
            throw error;
          }
        },
      }),
      {
        name: 'app-preferences-storage',
      }
    ),
    {
      name: 'app-preferences-store',
    }
  )
)