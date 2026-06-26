const PHP = 'PHP' as const

export type Currency = typeof PHP

/** Immutable peso amount — domain calculations use `.amount`; formatting is for presentation. */
export class Money {
  readonly amount: number
  readonly currency: Currency

  private constructor(amount: number, currency: Currency = PHP) {
    if (!Number.isFinite(amount)) throw new Error('Money amount must be finite.')
    this.amount = Math.round(amount)
    this.currency = currency
  }

  static peso(amount: number): Money {
    return new Money(amount, PHP)
  }

  static zero(): Money {
    return new Money(0, PHP)
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
    return this.amount < 0 ? Money.zero() : this
  }

  format(locale = 'en-PH'): string {
    return `₱${this.amount.toLocaleString(locale, { maximumFractionDigits: 0 })}`
  }

  toJSON(): { amount: number; currency: Currency } {
    return { amount: this.amount, currency: this.currency }
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`)
    }
  }
}
