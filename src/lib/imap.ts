import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

async function resolveMailboxPath(client: ImapFlow, logicalName: string): Promise<string> {
  const upper = logicalName.toUpperCase();
  if (upper === 'INBOX') return 'INBOX';

  try {
    const list = await client.list();
    if (list && Array.isArray(list)) {
      // 1. Check specialUse flags (Best method)
      const specialUseMapping: Record<string, string> = {
        'SENT': '\\Sent',
        'TRASH': '\\Trash',
        'SPAM': '\\Junk',
        'ARCHIVE': '\\Archive',
        'DRAFTS': '\\Drafts'
      };
      const targetFlag = specialUseMapping[upper];

      if (targetFlag) {
        for (const mb of list) {
          if (mb.specialUse === targetFlag || (mb.flags && mb.flags.has(targetFlag))) {
            return mb.path;
          }
        }
      }

      // 2. Check path names as fallback
      const fallbacks: Record<string, string[]> = {
        'SENT': ['sent', 'sent items', 'sent messages', '[gmail]/sent mail'],
        'TRASH': ['trash', 'deleted items', 'deleted messages', 'deleted', '[gmail]/trash', 'bin'],
        'SPAM': ['junk', 'spam', 'junk email', 'bulk mail', '[gmail]/spam']
      };
      const searchNames = fallbacks[upper] || [logicalName.toLowerCase()];

      for (const mb of list) {
        const pathLower = mb.path.toLowerCase();
        if (searchNames.some(s => pathLower.includes(s))) {
          return mb.path;
        }
      }
    }
  } catch (e) {
    console.warn("Could not list mailboxes for dynamic resolution:", e);
  }

  return logicalName; // Fallback
}

export async function fetchRecentEmails(account: any, logicalMailboxPath: string = 'INBOX') {
  if (!account.imapHost || !account.imapPort) return [];

  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: account.encryption === 'SSL' || account.imapPort === 993,
    auth: {
      user: account.username,
      pass: account.password
    },
    logger: false
  });

  const emails: any[] = [];

  try {
    await client.connect();

    const actualMailboxPath = await resolveMailboxPath(client, logicalMailboxPath);

    let lock;
    try {
      lock = await client.getMailboxLock(actualMailboxPath);
    } catch (e) {
      console.warn(`Mailbox ${actualMailboxPath} not found, falling back to INBOX`);
      lock = await client.getMailboxLock('INBOX');
    }

    try {
      if (!client.mailbox) return [];
      const totalMessages = (client.mailbox as any).exists;
      if (totalMessages === 0) return [];

      let fetchedMessages = [];

      // If it's the STARRED folder, we need to search for flagged messages across INBOX (or actual folder)
      if (logicalMailboxPath === 'STARRED') {
        const searchResult = await client.search({ flagged: true });
        if (searchResult && searchResult.length > 0) {
          // Get the last 50 starred messages
          const uids = searchResult.slice(-50);
          for await (let message of client.fetch(uids, { source: true, envelope: true }, { uid: true })) {
            fetchedMessages.push(message);
          }
        }
      } else {
        // Standard folder fetch - get last 50 messages
        const fetchLimit = 50;
        const seq = totalMessages > fetchLimit ? `${totalMessages - (fetchLimit - 1)}:*` : '1:*';
        for await (let message of client.fetch(seq, { source: true, envelope: true })) {
          fetchedMessages.push(message);
        }
      }

      for (let message of fetchedMessages) {
        if (!message.source) continue;
        const parsed = await simpleParser(message.source);
        emails.push({
          id: message.uid.toString(),
          from: parsed.from?.text || "Unknown Sender",
          subject: parsed.subject || "No Subject",
          snippet: parsed.text ? parsed.text.replace(/\s+/g, ' ').substring(0, 120) + '...' : "No content preview available.",
          date: parsed.date ? parsed.date.toLocaleDateString() + ' ' + parsed.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Unknown Date",
          sentiment: "Neutral",
          aiSummary: "Auto-synced via IMAP protocol.",
          isRead: message.flags ? message.flags.has('\\Seen') : false,
          isStarred: message.flags ? message.flags.has('\\Flagged') : false,
          mailbox: logicalMailboxPath
        });
      }
    } finally {
      lock.release();
    }
  } catch (error) {
    console.error("IMAP Fetch Error:", error);
  } finally {
    try {
      await client.logout();
    } catch (e) {
      // Ignore logout errors
    }
  }

  return emails.reverse();
}

export async function fetchEmailBody(account: any, mailboxPath: string, uid: string) {
  if (!account.imapHost || !account.imapPort) return null;

  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: account.encryption === 'SSL' || account.imapPort === 993,
    auth: {
      user: account.username,
      pass: account.password
    },
    logger: false
  });

  try {
    await client.connect();
    const actualMailboxPath = await resolveMailboxPath(client, mailboxPath);
    let lock;
    try {
      lock = await client.getMailboxLock(actualMailboxPath);
    } catch (e) {
      console.warn(`Mailbox ${actualMailboxPath} not found`);
      await client.logout();
      return null;
    }

    try {
      const message = await client.fetchOne(uid, { source: true }, { uid: true });
      if (message && message.source) {
        const parsed = await simpleParser(message.source);
        return {
          id: uid,
          from: parsed.from?.text || "Unknown Sender",
          to: (Array.isArray(parsed.to) ? parsed.to.map((t: any) => t.text).join(', ') : (parsed.to as any)?.text) || "Unknown",
          subject: parsed.subject || "No Subject",
          date: parsed.date ? parsed.date.toLocaleString() : "Unknown Date",
          html: parsed.html || parsed.textAsHtml || `<p>${parsed.text || 'No content'}</p>`,
          text: parsed.text || ""
        };
      }
    } finally {
      lock.release();
    }
  } catch (error) {
    console.error("IMAP Fetch Body Error:", error);
  } finally {
    try {
      await client.logout();
    } catch (e) { }
  }
  return null;
}

export async function performEmailAction(account: any, mailboxPath: string, uid: string, action: 'archive' | 'trash' | 'spam' | 'read' | 'unread') {
  if (!account.imapHost || !account.imapPort) return false;

  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: account.encryption === 'SSL' || account.imapPort === 993,
    auth: {
      user: account.username,
      pass: account.password
    },
    logger: false
  });

  try {
    await client.connect();
    const actualMailboxPath = await resolveMailboxPath(client, mailboxPath);
    let lock = await client.getMailboxLock(actualMailboxPath);
    try {
      if (action === 'read') {
        await client.messageFlagsAdd(uid, ['\\Seen']);
      } else if (action === 'unread') {
        await client.messageFlagsRemove(uid, ['\\Seen']);
      } else if (action === 'trash') {
        const trashPath = await resolveMailboxPath(client, 'TRASH');
        await client.messageMove(uid, trashPath);
      } else if (action === 'archive') {
        const archivePath = await resolveMailboxPath(client, 'ARCHIVE');
        await client.messageMove(uid, archivePath);
      } else if (action === 'spam') {
        const spamPath = await resolveMailboxPath(client, 'SPAM');
        await client.messageMove(uid, spamPath);
      }
      return true;
    } finally {
      lock.release();
    }
  } catch (error) {
    console.error(`IMAP Action Error (${action}):`, error);
    return false;
  } finally {
    try {
      await client.logout();
    } catch (e) { }
  }
}

export async function appendEmailToSentFolder(account: any, rawMessage: Buffer | string) {
  if (!account.imapHost || !account.imapPort) return false;

  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: account.encryption === 'SSL' || account.imapPort === 993,
    auth: {
      user: account.username,
      pass: account.password
    },
    logger: false
  });

  try {
    await client.connect();
    const sentMailbox = await resolveMailboxPath(client, 'SENT');
    await client.append(sentMailbox, rawMessage, ['\\Seen']);
    return true;
  } catch (error) {
    console.error("Failed to append sent email to IMAP:", error);
    return false;
  } finally {
    try {
      await client.logout();
    } catch (e) { }
  }
}
