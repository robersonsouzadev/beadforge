export const ADMIN_EMAILS = [
  'robersonsouza@outlook.com',
  'robersonsouzadev@gmail.com',
  'robersonsouzadev@outlook.com',
];

export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return ADMIN_EMAILS.includes(clean) || clean.startsWith('robersonsouza');
}
