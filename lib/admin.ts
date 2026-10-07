// Check if email has admin access
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;

  const adminEmails = process.env.ADMIN_EMAIL || "";

  // Support comma-separated list of admin emails
  const adminList = adminEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return adminList.includes(email.toLowerCase());
}
