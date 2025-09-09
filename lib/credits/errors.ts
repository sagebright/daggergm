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
