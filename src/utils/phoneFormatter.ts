export function formatPhone(raw: string | null): string | null {
  if (raw == null) return null;

  let cleaned = raw;
  if (cleaned.startsWith("'")) {
    cleaned = cleaned.slice(1);
  }
  cleaned = cleaned.replace(/[\s-]/g, '');

  if (cleaned.length === 0) return null;

  if (!cleaned.startsWith('+')) {
    cleaned = `+${cleaned}`;
  }

  return cleaned;
}

export function phoneForWhatsApp(phone: string): string {
  return phone.startsWith('+') ? phone.slice(1) : phone;
}
