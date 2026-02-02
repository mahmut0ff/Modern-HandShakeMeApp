/**
 * Data normalizers for consistent data handling
 * Нормализаторы данных для консистентной обработки
 */

interface UserData {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  [key: string]: any;
}

interface MasterData {
  user?: UserData;
  user_full_name?: string;
  user_first_name?: string;
  user_last_name?: string;
  user_avatar?: string;
  [key: string]: any;
}

/**
 * Get full name from various user data structures
 */
export const getFullName = (data: UserData | MasterData | null | undefined): string => {
  if (!data) return 'Пользователь';

  // Direct user object
  if ('full_name' in data && data.full_name) {
    return data.full_name;
  }

  // Nested user object
  if ('user' in data && data.user) {
    if (data.user.full_name) return data.user.full_name;
    const firstName = data.user.first_name || '';
    const lastName = data.user.last_name || '';
    if (firstName || lastName) return `${firstName} ${lastName}`.trim();
  }

  // Flattened user fields
  const firstName = ('user_first_name' in data && data.user_first_name) || 
                   ('first_name' in data && data.first_name) || '';
  const lastName = ('user_last_name' in data && data.user_last_name) || 
                  ('last_name' in data && data.last_name) || '';
  
  if (firstName || lastName) {
    return `${firstName} ${lastName}`.trim();
  }

  return 'Пользователь';
};

/**
 * Get avatar URL from various user data structures
 */
export const getAvatarUrl = (data: UserData | MasterData | null | undefined): string | null => {
  if (!data) return null;

  // Direct avatar
  if ('avatar' in data && data.avatar) {
    return data.avatar;
  }

  // Nested user object
  if ('user' in data && data.user?.avatar) {
    return data.user.avatar;
  }

  // Flattened user fields
  if ('user_avatar' in data && data.user_avatar) {
    return data.user_avatar;
  }

  return null;
};

/**
 * Normalize master profile data
 */
export const normalizeMasterProfile = (data: any) => {
  return {
    ...data,
    fullName: getFullName(data),
    avatar: getAvatarUrl(data),
  };
};

/**
 * Normalize order data
 */
export const normalizeOrder = (data: any) => {
  return {
    ...data,
    clientName: getFullName(data.client),
    clientAvatar: getAvatarUrl(data.client),
  };
};

/**
 * Normalize application data
 */
export const normalizeApplication = (data: any) => {
  return {
    ...data,
    masterName: getFullName(data.master),
    masterAvatar: getAvatarUrl(data.master),
  };
};
