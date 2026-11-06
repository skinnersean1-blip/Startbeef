// Admin helper functions

const ADMIN_EMAILS = [
  "skinnersean1@gmail.com",
  "sean@startbeef.com",
];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
