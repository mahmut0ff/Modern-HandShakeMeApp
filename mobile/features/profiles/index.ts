/**
 * Profiles Feature Exports
 * Модуль для работы с профилями пользователей
 */

// Screens
export { default as MasterProfileScreen } from './screens/MasterProfileScreen';
export { default as ClientProfileScreen } from './screens/ClientProfileScreen';
export { default as EditMasterProfileScreen } from './screens/EditMasterProfileScreen';
export { default as EditClientProfileScreen } from './screens/EditClientProfileScreen';
export { default as ProfileVisibilityScreen } from './screens/ProfileVisibilityScreen';

// Components
export { ProfileHeader } from './components/ProfileHeader';
export { ProfileStats } from './components/ProfileStats';
export { ProfileActions } from './components/ProfileActions';
export { ProfileSkillsList } from './components/ProfileSkillsList';
export { ProfileContactInfo } from './components/ProfileContactInfo';

// Hooks
export { useProfileActions } from './hooks/useProfileActions';

// Types
export type { ProfileType, MasterProfileFormData, ClientProfileFormData } from './types';
