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
            // TODO: Implement actual API call to save profile data
            console.log('Saving profile data:', formData)
            
            set({ hasChanges: false, isEditing: false })
          } catch (error) {
            console.error('Error saving profile:', error)
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
}

export const useAppPreferencesStore = create<AppPreferencesState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        setTheme: (theme) => set({ theme }),
        setLanguage: (language) => set({ language }),
        setTimezone: (timezone) => set({ timezone }),
        setEmailNotifications: (emailNotifications) => set({ emailNotifications }),
        setPushNotifications: (pushNotifications) => set({ pushNotifications }),
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