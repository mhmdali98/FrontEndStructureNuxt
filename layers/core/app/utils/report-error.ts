export interface ErrorReporter {
  report: (error: unknown, context?: Record<string, unknown>) => void
}

let reporter: ErrorReporter = { report: () => undefined }

/** Plug in Sentry (or similar) by implementing {@link ErrorReporter}. */
export function setErrorReporter(next: ErrorReporter): void {
  reporter = next
}

export function reportAppError(error: unknown, context?: Record<string, unknown>): void {
  reporter.report(error, context)
}
