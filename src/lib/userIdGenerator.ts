/**
 * User ID Generator Utility
 * Generates meaningful, distinguishable IDs for different user types
 */

// ID Prefixes for different user types
export const ID_PREFIXES = {
  REGISTERED_FREE: 'usf_',     // Registered free users
  REGISTERED_PRO: 'usp_',      // Registered pro users
  TEMPORARY: 'tmp_',           // Temporary/guest users (3 hour expiry)
  SESSION: 'ses_',             // Session identifiers
} as const;

// ID lengths (excluding prefix)
const ID_LENGTHS = {
  REGISTERED: 24,   // Long, secure IDs for permanent users
  TEMPORARY: 16,    // Medium IDs for temporary users
  SESSION: 12,      // Shorter IDs for sessions
} as const;

/**
 * Generate a random alphanumeric string using Web Crypto API
 */
function generateRandomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  // Use Web Crypto API which works in Edge Runtime
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

/**
 * Generate a timestamp-based component for IDs
 */
function getTimestampComponent(): string {
  return Date.now().toString(36);
}

/**
 * Generate a registered user ID (free tier)
 * Format: usf_<timestamp>_<random24>
 * Example: usf_1m2n3o4p_a1B2c3D4e5F6g7H8i9J0k1L2
 */
export function generateRegisteredFreeUserId(): string {
  const timestamp = getTimestampComponent();
  const random = generateRandomString(ID_LENGTHS.REGISTERED);
  return `${ID_PREFIXES.REGISTERED_FREE}${timestamp}_${random}`;
}

/**
 * Generate a registered pro user ID
 * Format: usp_<timestamp>_<random24>
 * Example: usp_1m2n3o4p_a1B2c3D4e5F6g7H8i9J0k1L2
 */
export function generateRegisteredProUserId(): string {
  const timestamp = getTimestampComponent();
  const random = generateRandomString(ID_LENGTHS.REGISTERED);
  return `${ID_PREFIXES.REGISTERED_PRO}${timestamp}_${random}`;
}

/**
 * Generate a temporary user ID
 * Format: tmp_<timestamp>_<random16>
 * Example: tmp_1m2n3o4p_a1B2c3D4e5F6g7H8
 */
export function generateTemporaryUserId(): string {
  const timestamp = getTimestampComponent();
  const random = generateRandomString(ID_LENGTHS.TEMPORARY);
  return `${ID_PREFIXES.TEMPORARY}${timestamp}_${random}`;
}

/**
 * Generate a session ID
 * Format: ses_<timestamp>_<random12>
 * Example: ses_1m2n3o4p_a1B2c3D4e5F6
 */
export function generateSessionId(): string {
  const timestamp = getTimestampComponent();
  const random = generateRandomString(ID_LENGTHS.SESSION);
  return `${ID_PREFIXES.SESSION}${timestamp}_${random}`;
}

/**
 * Check if an ID is a registered user ID (any tier)
 */
export function isRegisteredUserId(id: string): boolean {
  return id.startsWith(ID_PREFIXES.REGISTERED_FREE) || id.startsWith(ID_PREFIXES.REGISTERED_PRO);
}

/**
 * Check if an ID is a registered free user ID
 */
export function isRegisteredFreeUserId(id: string): boolean {
  return id.startsWith(ID_PREFIXES.REGISTERED_FREE);
}

/**
 * Check if an ID is a registered pro user ID
 */
export function isRegisteredProUserId(id: string): boolean {
  return id.startsWith(ID_PREFIXES.REGISTERED_PRO);
}

/**
 * Check if an ID is a temporary user ID
 */
export function isTemporaryUserId(id: string): boolean {
  return id.startsWith(ID_PREFIXES.TEMPORARY);
}

/**
 * Check if an ID is a session ID
 */
export function isSessionId(id: string): boolean {
  return id.startsWith(ID_PREFIXES.SESSION);
}

/**
 * Extract timestamp from ID
 */
export function extractTimestampFromId(id: string): number | null {
  try {
    // Remove prefix and get timestamp part
    const withoutPrefix = id.substring(4); // Remove 'xxx_'
    const timestampPart = withoutPrefix.split('_')[0];
    return parseInt(timestampPart, 36);
  } catch {
    return null;
  }
}

/**
 * Check if a temporary user ID has expired (3 hours)
 */
export function isTemporaryUserExpired(id: string): boolean {
  if (!isTemporaryUserId(id)) return false;
  
  const timestamp = extractTimestampFromId(id);
  if (!timestamp) return true;
  
  const threeHoursInMs = 3 * 60 * 60 * 1000; // 3 hours
  return Date.now() - timestamp > threeHoursInMs;
}

/**
 * Validate ID format
 */
export function validateIdFormat(id: string): boolean {
  const patterns = {
    [ID_PREFIXES.REGISTERED_FREE]: new RegExp(`^${ID_PREFIXES.REGISTERED_FREE}[a-z0-9]+_[a-zA-Z0-9]{${ID_LENGTHS.REGISTERED}}$`),
    [ID_PREFIXES.REGISTERED_PRO]: new RegExp(`^${ID_PREFIXES.REGISTERED_PRO}[a-z0-9]+_[a-zA-Z0-9]{${ID_LENGTHS.REGISTERED}}$`),
    [ID_PREFIXES.TEMPORARY]: new RegExp(`^${ID_PREFIXES.TEMPORARY}[a-z0-9]+_[a-zA-Z0-9]{${ID_LENGTHS.TEMPORARY}}$`),
    [ID_PREFIXES.SESSION]: new RegExp(`^${ID_PREFIXES.SESSION}[a-z0-9]+_[a-zA-Z0-9]{${ID_LENGTHS.SESSION}}$`),
  };

  return Object.values(patterns).some(pattern => pattern.test(id));
}

/**
 * Get user type from ID
 */
export function getUserTypeFromId(id: string): 'registered_free' | 'registered_pro' | 'temporary' | 'session' | 'unknown' {
  if (isRegisteredFreeUserId(id)) return 'registered_free';
  if (isRegisteredProUserId(id)) return 'registered_pro';
  if (isTemporaryUserId(id)) return 'temporary';
  if (isSessionId(id)) return 'session';
  return 'unknown';
}

/**
 * Generate appropriate user ID based on authentication status and subscription
 */
export function generateUserIdForAuth(isAuthenticated: boolean, isPro: boolean = false, email?: string): string {
  if (isAuthenticated && email) {
    return isPro ? generateRegisteredProUserId() : generateRegisteredFreeUserId();
  }
  return generateTemporaryUserId();
}

/**
 * Upgrade user ID from free to pro
 */
export function upgradeUserIdToPro(freeUserId: string): string {
  if (!isRegisteredFreeUserId(freeUserId)) {
    throw new Error('Can only upgrade registered free user IDs');
  }
  
  // Extract the unique part and regenerate with pro prefix
  const parts = freeUserId.split('_');
  if (parts.length >= 3) {
    const timestamp = parts[1];
    const random = parts.slice(2).join('_');
    return `${ID_PREFIXES.REGISTERED_PRO}${timestamp}_${random}`;
  }
  
  // Fallback: generate new pro ID
  return generateRegisteredProUserId();
}

/**
 * Check if user has pro access based on ID
 */
export function hasProAccess(userId: string): boolean {
  return isRegisteredProUserId(userId);
}

/**
 * Get usage limits based on user type
 */
export function getUserLimits(userId: string): {
  maxDocuments: number;
  maxChatMessages: number;
  hasUnlimitedAccess: boolean;
  planName: string;
} {
  const userType = getUserTypeFromId(userId);
  
  switch (userType) {
    case 'registered_pro':
      return {
        maxDocuments: -1, // Unlimited
        maxChatMessages: -1, // Unlimited
        hasUnlimitedAccess: true,
        planName: 'Pro'
      };
    
    case 'registered_free':
      return {
        maxDocuments: 10, // More than temporary users
        maxChatMessages: 50, // More than temporary users
        hasUnlimitedAccess: false,
        planName: 'Free (Registered)'
      };
    
    case 'temporary':
      return {
        maxDocuments: 1,
        maxChatMessages: 5,
        hasUnlimitedAccess: false,
        planName: 'Free (Guest)'
      };
    
    default:
      return {
        maxDocuments: 0,
        maxChatMessages: 0,
        hasUnlimitedAccess: false,
        planName: 'Unknown'
      };
  }
}