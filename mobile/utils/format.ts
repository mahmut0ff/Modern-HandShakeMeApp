/**
 * Utility functions for formatting data
 */

export function formatCurrency(amount: string | number, currency: string = 'сом'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numAmount)) return '0 ' + currency
  
  return new Intl.NumberFormat('ru-RU').format(numAmount) + ' ' + currency
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'только что'
    if (diffMins < 60) return `${diffMins} мин назад`
    if (diffHours < 24) return `${diffHours} ч назад`
    if (diffDays < 7) return `${diffDays} дн назад`
    
    return formatDate(dateString)
  } catch {
    return dateString
  }
}

export function formatPhoneNumber(phone: string): string {
  // Format +996XXXXXXXXX to +996 XXX XXX XXX
  if (phone.startsWith('+996') && phone.length === 13) {
    return `+996 ${phone.slice(4, 7)} ${phone.slice(7, 10)} ${phone.slice(10)}`
  }
  return phone
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}