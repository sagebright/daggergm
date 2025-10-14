/**
 * Base error class for credit-related errors
 */
export class CreditError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'CreditError'
    Object.setPrototypeOf(this, CreditError.prototype)
  }
}

/**
 * Error thrown when user has insufficient credits
 */
export class InsufficientCreditsError extends CreditError {
  constructor(message: string = 'Insufficient credits to perform this action') {
    super(message, 'insufficient_credits')
    this.name = 'InsufficientCreditsError'
    Object.setPrototypeOf(this, InsufficientCreditsError.prototype)
  }
}

/**
 * Error thrown when credit consumption fails
 */
export class CreditConsumptionError extends CreditError {
  constructor(message: string = 'Failed to consume credit') {
    super(message, 'credit_consumption_failed')
    this.name = 'CreditConsumptionError'
    Object.setPrototypeOf(this, CreditConsumptionError.prototype)
  }
}
