/**
 * Safely format a date string to localized date format
 * @param dateString - ISO date string or timestamp
 * @param locale - Locale for formatting (default: 'ru-RU')
 * @param fallback - Fallback text if date is invalid (default: 'Дата не указана')
 * @returns Formatted date string or fallback
 */
export function formatDate(
    dateString: string | number | undefined | null,
    locale: string = 'ru-RU',
    fallback: string = 'Дата не указана'
): string {
    if (!dateString) return fallback;
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return fallback;
        
        return date.toLocaleDateString(locale, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Invalid date format:', dateString, error);
        return fallback;
    }
}

/**
 * Format date with time
 * @param dateString - ISO date string or timestamp
 * @param locale - Locale for formatting (default: 'ru-RU')
 * @param fallback - Fallback text if date is invalid
 * @returns Formatted date and time string or fallback
 */
export function formatDateTime(
    dateString: string | number | undefined | null,
    locale: string = 'ru-RU',
    fallback: string = 'Дата не указана'
): string {
    if (!dateString) return fallback;
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return fallback;
        
        return date.toLocaleString(locale, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Invalid date format:', dateString, error);
        return fallback;
    }
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param dateString - ISO date string or timestamp
 * @param locale - Locale for formatting (default: 'ru-RU')
 * @returns Relative time string
 */
export function getRelativeTime(
    dateString: string | number | undefined | null,
    locale: string = 'ru-RU'
): string {
    if (!dateString) return 'Неизвестно';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Неизвестно';
        
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Только что';
        if (diffMins < 60) return `${diffMins} мин назад`;
        if (diffHours < 24) return `${diffHours} ч назад`;
        if (diffDays < 7) return `${diffDays} дн назад`;
        
        return formatDate(dateString, locale);
    } catch (error) {
        console.error('Invalid date format:', dateString, error);
        return 'Неизвестно';
    }
}
