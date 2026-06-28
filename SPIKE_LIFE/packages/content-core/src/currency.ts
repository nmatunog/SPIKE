import type { CurrencyConfig } from './types.js'

export function formatCurrency(amount: number, config: CurrencyConfig): string {
  const digits = config.maximumFractionDigits ?? 0
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    }).format(amount)
  } catch {
    const symbol = config.symbol ?? config.code
    return `${symbol}${Math.round(amount).toLocaleString(config.locale)}`
  }
}
