/**
 * formatPhone — Indian mobile number formatter
 * Output format: "+91 XXXXXXXXXX"   e.g. "+91 6369591821"
 *
 * Handles all common storage formats:
 *   "919360220096"   → "+91 9360220096"   (12 digits, starts with 91)
 *   "9360220096"     → "+91 9360220096"   (10 digits, no country code)
 *   "+919360220096"  → "+91 9360220096"   (has + prefix)
 *   "09360220096"    → "+91 9360220096"   (leading 0)
 *   ""  / null / undefined → ""
 */
export function formatPhone(raw) {
  if (!raw) return '';

  // Strip all non-digit characters
  const digits = String(raw).replace(/\D/g, '');

  let mobile = '';

  if (digits.length === 10) {
    // Plain 10-digit mobile: 9360220096
    mobile = digits;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    // With country code prefix: 919360220096 → strip "91"
    mobile = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    // With leading zero: 09360220096
    mobile = digits.slice(1);
  } else if (digits.length > 10) {
    // Any other long number — take the last 10 digits (best effort)
    mobile = digits.slice(-10);
  } else {
    // Short/unknown — show as-is
    return `+91 ${digits}`;
  }

  // Safety check
  if (mobile.length !== 10) return `+91 ${digits}`;

  // Final format: "+91 XXXXXXXXXX"
  return `+91 ${mobile}`;
}
