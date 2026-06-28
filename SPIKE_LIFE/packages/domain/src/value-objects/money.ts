import type { CurrencyConfig } from '@spike-life/content-core'
import { formatCurrency } from '@spike-life/content-core'

export type CurrencyCode = string

/** Immutable monetary amount — calculations use `.amount`; formatting is presentation-only. */
export class Money {
  readonly amount: number
  readonly currency: CurrencyCode

  private constructor(amount: number, currency: CurrencyCode) {
    if (!Number.isFinite(amount)) throw new Error('Money amount must be finite.')
    this.amount = Math.round(amount)
    this.currency = currency
  }

  static of(amount: number, currency: CurrencyCode): Money {
    return new Money(amount, currency)
  }

  /** Convenience for callers that already hold a currency code from session state. */
  static fromAmount(amount: number, currency: CurrencyCode): Money {
    return Money.of(amount, currency)
  }

  /** @deprecated Prefer `Money.of(amount, currency.code)` with pack config */
  static peso(amount: number): Money {
    return new Money(amount, 'PHP')
  }

  static zero(currency: CurrencyCode = 'USD'): Money {
    return new Money(0, currency)
  }

  add(other: Money): Money {
    this.assertSameCurrency(other)
    return new Money(this.amount + other.amount, this.currency)
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other)
    return new Money(this.amount - other.amount, this.currency)
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency)
  }

  isNegative(): boolean {
    return this.amount < 0
  }

  clampNonNegative(): Money {
    return this.amount < 0 ? Money.zero(this.currency) : this
  }

  format(config: CurrencyConfig): string {
    return formatCurrency(this.amount, {
      ...config,
      code: config.code || this.currency,
    })
  }

  toJSON(): { amount: number; currency: CurrencyCode } {
    return { amount: this.amount, currency: this.currency }
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`)
    }
  }
}

export function formatAmount(amount: number, config: CurrencyConfig): string {
  return formatCurrency(amount, config)
}
