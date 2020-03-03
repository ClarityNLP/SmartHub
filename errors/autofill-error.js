module.exports = class AutofillError extends Error {
  constructor(
    autofillId = "unknown",
    ...params
  ) {
    // Pass remaining arguments (including vendor
    // specific ones) to parent constructor
    super(...params)

    // Maintains proper stack trace for where our
    // error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AutofillError)
    }

    this.name = 'AutofillError'
    // Custom debugging information
    this.autofillId = autofillId,
    this.date = new Date()
  }
}
