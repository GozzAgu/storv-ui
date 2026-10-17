import { getApiErrorMessage } from '~/utils/api-error-message'

/** What a shop sees when emailing a receipt fails; never the raw request or server setup notes. */
export function receiptEmailErrorMessage(error: unknown): string {
  const status =
    (error as { statusCode?: number; status?: number })?.statusCode ??
    (error as { status?: number })?.status
  if (status === 503) {
    return 'Email receipts are not available right now. Share the receipt on WhatsApp or download the PDF instead.'
  }
  return getApiErrorMessage(error, 'Could not send the email. Please try again.')
}
