export const ADMIN_EMAILS = [
  'robersonsouza@outlook.com',
  // Adicione outros emails de administradores se necessário
];

export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}
