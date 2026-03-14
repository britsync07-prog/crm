export function getAppBaseUrl() {
  const fromEnv =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL;

  if (fromEnv && /^https?:\/\//i.test(fromEnv)) {
    return fromEnv.replace(/\/+$/, "");
  }

  const port = process.env.PORT || "3001";
  return `http://localhost:${port}`;
}
