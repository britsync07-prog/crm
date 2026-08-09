import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import tls from 'tls';
import net from 'net';

type ImapAccount = {
  id?: string;
  email?: string;
  imapHost?: string | null;
  imapPort?: number | null;
  username: string;
  password: string;
  encryption?: string | null;
};

const imapIssueLogState = new Map<string, number>();
const IMAP_ISSUE_LOG_INTERVAL_MS = 15 * 60 * 1000;

function isConnectionOpen(client: ImapFlow) {
  return (client as any).usable || (client as any).authenticated || (client as any).state > 0;
}

function isDirectTls(encryption: string | null | undefined, port: number | null | undefined) {
  const mode = (encryption || '').toUpperCase();
  return port === 993 || mode === 'SSL' || mode === 'SSL/TLS';
}

function isStartTlsRequired(encryption: string | null | undefined, port: number | null | undefined) {
  const mode = (encryption || '').toUpperCase();
  return !isDirectTls(encryption, port) && (mode === 'TLS' || mode === 'STARTTLS');
}

function createImapClient(account: ImapAccount) {
  if (!account.imapHost || !account.imapPort) {
    throw new Error('IMAP host and port are required.');
  }

  const secure = isDirectTls(account.encryption, account.imapPort);

  return new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure,
    doSTARTTLS: secure ? undefined : isStartTlsRequired(account.encryption, account.imapPort),
    auth: {
      user: account.username,
      pass: account.password,
      loginMethod: 'LOGIN'
    },
    logger: false
  });
}

function escapeImapString(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function waitForSocketData(socket: net.Socket, done: (buffer: Buffer) => boolean, timeoutMs = 30000): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('IMAP server response timed out.'));
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      socket.off('data', onData);
      socket.off('error', onError);
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const onData = (chunk: Buffer) => {
      chunks.push(chunk);
      const buffer = Buffer.concat(chunks);
      if (done(buffer)) {
        cleanup();
        resolve(buffer);
      }
    };

    socket.on('data', onData);
    socket.on('error', onError);
  });
}

async function createRawSocket(account: ImapAccount): Promise<net.Socket> {
  const secure = isDirectTls(account.encryption, account.imapPort);
  const options = {
    host: account.imapHost!,
    port: account.imapPort!,
  };

  const socket = secure ? tls.connect({ ...options, servername: account.imapHost || undefined }) : net.connect(options);
  await new Promise<void>((resolve, reject) => {
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      socket.off(secure ? 'secureConnect' : 'connect', onReady);
      socket.off('error', onError);
    };
    socket.once(secure ? 'secureConnect' : 'connect', onReady);
    socket.once('error', onError);
  });
  await waitForSocketData(socket, (buffer) => buffer.toString('utf8').includes('\r\n'));
  return socket;
}

async function rawCommand(socket: net.Socket, tag: string, command: string) {
  socket.write(`${tag} ${command}\r\n`);
  const buffer = await waitForSocketData(socket, (data) => {
    const text = data.toString('latin1');
    return text.includes(`${tag} OK`) || text.includes(`${tag} NO`) || text.includes(`${tag} BAD`);
  });
  const text = buffer.toString('latin1');
  if (text.includes(`${tag} NO`) || text.includes(`${tag} BAD`)) {
    throw new Error(text.split(/\r?\n/).find((line) => line.startsWith(tag)) || 'IMAP command failed.');
  }
  return buffer;
}

function extractFirstLiteral(buffer: Buffer): Buffer | null {
  const marker = Buffer.from('}\r\n', 'latin1');
  const text = buffer.toString('latin1');
  const match = /\{(\d+)\}\r\n/.exec(text);
  if (!match || match.index < 0) return null;
  const literalStart = buffer.indexOf(marker, match.index, 'latin1') + marker.length;
  const length = Number(match[1]);
  if (!Number.isFinite(length) || literalStart < marker.length || literalStart + length > buffer.length) return null;
  return buffer.subarray(literalStart, literalStart + length);
}

function parseFlags(buffer: Buffer): Set<string> {
  const text = buffer.toString('latin1');
  const match = /FLAGS \(([^)]*)\)/i.exec(text);
  return new Set((match?.[1] || '').split(/\s+/).filter(Boolean));
}

async function withRawImap<T>(account: ImapAccount, fn: (socket: net.Socket) => Promise<T>): Promise<T> {
  if (!account.imapHost || !account.imapPort) throw new Error('IMAP host and port are required.');
  const socket = await createRawSocket(account);
  try {
    await rawCommand(socket, 'a1', `LOGIN "${escapeImapString(account.username)}" "${escapeImapString(account.password)}"`);
    return await fn(socket);
  } finally {
    try {
      socket.write('zz LOGOUT\r\n');
    } catch {
      // Ignore closed sockets.
    }
    socket.destroy();
  }
}

async function rawFetchRecentEmails(account: ImapAccount, logicalMailboxPath: string) {
  return withRawImap(account, async (socket) => {
    const isStarredFolder = logicalMailboxPath.toUpperCase() === 'STARRED';
    await rawCommand(socket, 'a2', 'SELECT "INBOX"');
    const searchBuffer = await rawCommand(socket, 'a3', 'UID SEARCH ALL');
    const searchText = searchBuffer.toString('latin1');
    const searchLine = searchText.split(/\r?\n/).find((line) => line.startsWith('* SEARCH')) || '';
    const uids = searchLine.replace('* SEARCH', '').trim().split(/\s+/).map(Number).filter((uid) => Number.isFinite(uid));
    const recentUids = uids.slice(-50);
    const emails: any[] = [];

    for (let index = 0; index < recentUids.length; index += 1) {
      const uid = recentUids[index];
      const fetchBuffer = await rawCommand(socket, `a${index + 4}`, `UID FETCH ${uid} (FLAGS BODY.PEEK[])`);
      const source = extractFirstLiteral(fetchBuffer);
      if (!source) continue;
      const flags = parseFlags(fetchBuffer);
      if (isStarredFolder && !flags.has('\\Flagged')) continue;
      const parsed = await simpleParser(source);
      emails.push({
        id: String(uid),
        from: parsed.from?.text || "Unknown Sender",
        subject: parsed.subject || "No Subject",
        snippet: parsed.text ? parsed.text.replace(/\s+/g, ' ').substring(0, 120) + '...' : "No content preview available.",
        date: parsed.date ? parsed.date.toLocaleDateString() + ' ' + parsed.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Unknown Date",
        sentiment: "Neutral",
        aiSummary: "Auto-synced via IMAP protocol.",
        isRead: flags.has('\\Seen'),
        isStarred: flags.has('\\Flagged'),
        mailbox: logicalMailboxPath
      });
    }

    return emails.reverse();
  });
}

async function rawFetchEmailBody(account: ImapAccount, mailboxPath: string, uid: string) {
  return withRawImap(account, async (socket) => {
    await rawCommand(socket, 'a2', `SELECT "${escapeImapString(mailboxPath.toUpperCase() === 'STARRED' ? 'INBOX' : mailboxPath)}"`);
    const fetchBuffer = await rawCommand(socket, 'a3', `UID FETCH ${Number(uid)} (BODY.PEEK[])`);
    const source = extractFirstLiteral(fetchBuffer);
    if (!source) return null;
    const parsed = await simpleParser(source);
    return {
      id: uid,
      from: parsed.from?.text || "Unknown Sender",
      to: (Array.isArray(parsed.to) ? parsed.to.map((t: any) => t.text).join(', ') : (parsed.to as any)?.text) || "Unknown",
      subject: parsed.subject || "No Subject",
      date: parsed.date ? parsed.date.toLocaleString() : "Unknown Date",
      html: parsed.html || parsed.textAsHtml || `<p>${parsed.text || 'No content'}</p>`,
      text: parsed.text || ""
    };
  });
}

function formatImapError(error: unknown) {
  const err = error as any;
  const detail = [err?.response, err?.responseText, err?.serverResponseCode, err?.code]
    .filter(Boolean)
    .join(" ");
  const message = `${error instanceof Error ? error.message : String(error)} ${detail}`.trim();
  if (/CONTACTADMIN|login (?:is )?not permitted/i.test(message)) {
    return 'IMAP login is not permitted for this mailbox. Check that IMAP access is enabled for the account or contact the mail provider.';
  }
  if (/authentication|login|invalid credentials|auth/i.test(message)) {
    return 'IMAP login failed. Check the mailbox email address and password.';
  }
  if (/STARTTLS/i.test(message)) {
    return 'IMAP STARTTLS is not available on this server/port. Use port 993 with SSL/TLS for this mailbox.';
  }
  if (/certificate|self signed|tls/i.test(message)) {
    return 'IMAP TLS connection failed. Check the host, port, and security mode.';
  }
  if (/timeout|greeting|ECONNREFUSED|ENOTFOUND|EAI_AGAIN/i.test(message)) {
    return 'IMAP server could not be reached. Check the IMAP host and port.';
  }
  return `IMAP connection failed: ${message}`;
}

function isProviderBlockedLogin(error: unknown) {
  return /CONTACTADMIN|login (?:is )?not permitted/i.test(formatImapError(error));
}

function logImapIssue(scope: string, account: ImapAccount, error: unknown) {
  const message = formatImapError(error);
  const key = `${scope}:${account.id || account.email || account.username}:${message}`;
  const now = Date.now();
  const last = imapIssueLogState.get(key) || 0;
  if (now - last < IMAP_ISSUE_LOG_INTERVAL_MS) return;
  imapIssueLogState.set(key, now);
  console.error(`${scope}: ${message}`);
}

export async function verifyImapConnection(account: ImapAccount) {
  const client = createImapClient(account);
  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    lock.release();
  } catch (error) {
    throw new Error(formatImapError(error));
  } finally {
    try {
      if (isConnectionOpen(client)) await client.logout();
    } catch {
      // Ignore logout errors after failed connection attempts.
    }
  }
}

async function resolveMailboxPath(client: ImapFlow, logicalName: string): Promise<string> {
  const upper = logicalName.toUpperCase();
  if (upper === 'INBOX' || upper === 'STARRED') return 'INBOX';

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
  const client = createImapClient(account);

  const emails: any[] = [];

  try {
    await client.connect();

    const isStarredFolder = logicalMailboxPath.toUpperCase() === 'STARRED';
    const actualMailboxPath = isStarredFolder ? 'INBOX' : await resolveMailboxPath(client, logicalMailboxPath);

    let lock;
    try {
      lock = await client.getMailboxLock(actualMailboxPath);
    } catch {
      if (!isStarredFolder) console.warn(`Mailbox ${actualMailboxPath} not found, falling back to INBOX`);
      lock = await client.getMailboxLock('INBOX');
    }

    try {
      if (!client.mailbox) return [];
      const totalMessages = (client.mailbox as any).exists;
      if (totalMessages === 0) return [];

      const fetchedMessages = [];

      // If it's the STARRED folder, we need to search for flagged messages across INBOX (or actual folder)
      if (isStarredFolder) {
        const searchResult = await client.search({ flagged: true });
        if (searchResult && searchResult.length > 0) {
          // Get the last 50 starred messages
          const uids = searchResult.slice(-50);
          for await (const message of client.fetch(uids, { source: true, envelope: true }, { uid: true })) {
            fetchedMessages.push(message);
          }
        }
      } else {
        // Standard folder fetch - get last 50 messages
        const fetchLimit = 50;
        const seq = totalMessages > fetchLimit ? `${totalMessages - (fetchLimit - 1)}:*` : '1:*';
        for await (const message of client.fetch(seq, { source: true, envelope: true })) {
          fetchedMessages.push(message);
        }
      }

      if (fetchedMessages.length === 0 && totalMessages > 0) {
        return await rawFetchRecentEmails(account, logicalMailboxPath);
      }

      for (const message of fetchedMessages) {
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
    throw new Error(formatImapError(error));
  } finally {
    try {
      if (isConnectionOpen(client)) await client.logout();
    } catch {
      // Ignore logout errors
    }
  }

  return emails.reverse();
}

export async function fetchEmailBody(account: any, mailboxPath: string, uid: string) {
  const client = createImapClient(account);

  try {
    await client.connect();
    const actualMailboxPath = await resolveMailboxPath(client, mailboxPath);
    let lock;
    try {
      lock = await client.getMailboxLock(actualMailboxPath);
    } catch {
      console.warn(`Mailbox ${actualMailboxPath} not found`);
      return null;
    }

    try {
      let message;
      try {
        message = await client.fetchOne(uid, { source: true }, { uid: true });
      } catch (fetchError) {
        const fallback = await rawFetchEmailBody(account, mailboxPath, uid);
        if (fallback) return fallback;
        throw fetchError;
      }
      if (!message) {
        return await rawFetchEmailBody(account, mailboxPath, uid);
      }
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
    throw new Error(formatImapError(error));
  } finally {
    try {
      if (isConnectionOpen(client)) await client.logout();
    } catch { }
  }
  return null;
}

export async function performEmailAction(account: any, mailboxPath: string, uid: string, action: 'archive' | 'trash' | 'spam' | 'read' | 'unread' | 'star' | 'unstar') {
  const client = createImapClient(account);

  try {
    await client.connect();
    const actualMailboxPath = await resolveMailboxPath(client, mailboxPath);
    const lock = await client.getMailboxLock(actualMailboxPath);
    try {
      if (action === 'read') {
        await client.messageFlagsAdd(uid, ['\\Seen']);
      } else if (action === 'unread') {
        await client.messageFlagsRemove(uid, ['\\Seen']);
      } else if (action === 'star') {
        await client.messageFlagsAdd(uid, ['\\Flagged']);
      } else if (action === 'unstar') {
        await client.messageFlagsRemove(uid, ['\\Flagged']);
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
    throw new Error(formatImapError(error));
  } finally {
    try {
      if (isConnectionOpen(client)) await client.logout();
    } catch { }
  }
}

export async function appendEmailToSentFolder(account: any, rawMessage: Buffer | string) {
  const client = createImapClient(account);

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
      if (isConnectionOpen(client)) await client.logout();
    } catch { }
  }
}

export async function performBatchEmailAction(
  account: any,
  mailboxPath: string,
  uids: string[],
  action: 'archive' | 'trash' | 'spam' | 'read' | 'unread' | 'star' | 'unstar'
) {
  if (uids.length === 0) return { success: 0, failed: 0 };

  const client = createImapClient(account);

  let success = 0, failed = 0;
  const numericUids = uids.map(Number).filter(n => !isNaN(n));

  try {
    await client.connect();
    const actualMailboxPath = await resolveMailboxPath(client, mailboxPath);
    const lock = await client.getMailboxLock(actualMailboxPath);
    try {
      if (action === 'read') {
        await client.messageFlagsAdd(numericUids, ['\\Seen']);
        success = numericUids.length;
      } else if (action === 'unread') {
        await client.messageFlagsRemove(numericUids, ['\\Seen']);
        success = numericUids.length;
      } else if (action === 'star') {
        await client.messageFlagsAdd(numericUids, ['\\Flagged']);
        success = numericUids.length;
      } else if (action === 'unstar') {
        await client.messageFlagsRemove(numericUids, ['\\Flagged']);
        success = numericUids.length;
      } else if (action === 'trash') {
        const trashPath = await resolveMailboxPath(client, 'TRASH');
        for (const uid of uids) {
          try {
            await client.messageMove(uid, trashPath);
            success++;
          } catch { failed++; }
        }
      } else if (action === 'archive') {
        const archivePath = await resolveMailboxPath(client, 'ARCHIVE');
        for (const uid of uids) {
          try {
            await client.messageMove(uid, archivePath);
            success++;
          } catch { failed++; }
        }
      } else if (action === 'spam') {
        const spamPath = await resolveMailboxPath(client, 'SPAM');
        for (const uid of uids) {
          try {
            await client.messageMove(uid, spamPath);
            success++;
          } catch { failed++; }
        }
      }
    } finally {
      lock.release();
    }
  } catch (error) {
    console.error(`IMAP Batch Action Error (${action}):`, error);
    throw new Error(formatImapError(error));
  } finally {
    try { if (isConnectionOpen(client)) await client.logout(); } catch { }
  }

  return { success, failed };
}

export async function fetchRecentInboxReplyCandidates(
  account: any,
  since: Date
): Promise<Array<{ fromEmail: string; subject: string; date: Date }>> {
  const client = createImapClient(account);

  const candidates: Array<{ fromEmail: string; subject: string; date: Date }> = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      if (!client.mailbox) return [];
      const totalMessages = (client.mailbox as any).exists;
      if (totalMessages === 0) return [];

      const fetchLimit = 80;
      const seq = totalMessages > fetchLimit ? `${totalMessages - (fetchLimit - 1)}:*` : '1:*';
      for await (const message of client.fetch(seq, { source: true, envelope: true, flags: true })) {
        if (!message.source) continue;
        const parsed = await simpleParser(message.source);
        const fromEmail = parsed.from?.value?.[0]?.address?.toLowerCase() || '';
        const subject = parsed.subject || '';
        const date = parsed.date ? new Date(parsed.date) : null;
        if (!fromEmail || !date || Number.isNaN(date.getTime())) continue;
        if (date < since) continue;
        if (!/^\s*re\s*:/i.test(subject) && !parsed.inReplyTo && (!parsed.references || parsed.references.length === 0)) continue;
        candidates.push({ fromEmail, subject, date });
      }
    } finally {
      lock.release();
    }
  } catch (error) {
    if (!isProviderBlockedLogin(error)) {
      logImapIssue("IMAP Reply Sync Error", account, error);
    }
  } finally {
    try {
      if (isConnectionOpen(client)) await client.logout();
    } catch { }
  }

  return candidates;
}
