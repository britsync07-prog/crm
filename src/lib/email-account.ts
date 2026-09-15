import { prisma } from "@/lib/db";

/**
 * Checks if an email account's sentToday counter needs to be reset.
 * An account needs reset if:
 * 1. It was never reset before (lastResetAt is null).
 * 2. It has been 24 hours or more since lastResetAt.
 * 3. The calendar date of lastResetAt is before today's date (midnight has passed).
 */
export function shouldResetSentToday(lastResetAt: Date | null | undefined): boolean {
  if (!lastResetAt) return true;
  const now = new Date();
  const lastDate = new Date(lastResetAt);

  // More than 24 hours passed
  if (now.getTime() - lastDate.getTime() >= 24 * 60 * 60 * 1000) {
    return true;
  }

  // Calendar day changed (midnight crossed in local or UTC)
  const isDifferentDay =
    now.toDateString() !== lastDate.toDateString() ||
    now.getUTCDate() !== lastDate.getUTCDate() ||
    now.getUTCMonth() !== lastDate.getUTCMonth() ||
    now.getUTCFullYear() !== lastDate.getUTCFullYear();

  return isDifferentDay;
}

/**
 * Synchronizes and resets sentToday for all email accounts (optionally filtered by userId).
 * Returns the accounts with up-to-date sentToday values.
 */
export async function syncAllEmailAccountsDailyLimits(userId?: string) {
  const accounts = await prisma.emailAccount.findMany({
    where: userId ? { userId } : undefined,
  });

  const now = new Date();
  const accountsToReset = accounts.filter((acc) => shouldResetSentToday(acc.lastResetAt));

  if (accountsToReset.length > 0) {
    const ids = accountsToReset.map((acc) => acc.id);
    await prisma.emailAccount.updateMany({
      where: { id: { in: ids } },
      data: {
        sentToday: 0,
        lastResetAt: now,
      },
    });
  }

  return accounts.map((acc) => {
    if (shouldResetSentToday(acc.lastResetAt)) {
      return { ...acc, sentToday: 0, lastResetAt: now };
    }
    return acc;
  });
}

/**
 * Checks and resets an account before an email is sent.
 */
export async function prepareEmailAccountForSend(accountId: string) {
  const account = await prisma.emailAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) return null;

  const now = new Date();
  if (shouldResetSentToday(account.lastResetAt)) {
    return await prisma.emailAccount.update({
      where: { id: accountId },
      data: {
        sentToday: 0,
        lastResetAt: now,
      },
    });
  }

  return account;
}
