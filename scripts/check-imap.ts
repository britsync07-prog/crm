import { ImapFlow } from "imapflow";

const [, , hostArg, portArg, userArg, passArg, securityArg] = process.argv;
const host = hostArg;
const port = Number(portArg);
const user = userArg;
const pass = passArg;
const security = (securityArg || (port === 993 ? "SSL/TLS" : "STARTTLS")).toUpperCase();

if (!host || !Number.isInteger(port) || !user || !pass) {
  console.error("Usage: npm run imap:check -- host port user password [SSL/TLS|STARTTLS|NONE]");
  process.exit(1);
}

const secure = port === 993 || security === "SSL" || security === "SSL/TLS";

async function main() {
  const client = new ImapFlow({
    host,
    port,
    secure,
    doSTARTTLS: secure ? undefined : security === "STARTTLS",
    auth: { user, pass, loginMethod: "LOGIN" },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    const exists = client.mailbox ? client.mailbox.exists : 0;
    lock.release();
    console.log(JSON.stringify({ ok: true, host, port, security, user, inboxMessages: exists }, null, 2));
  } catch (error: any) {
    console.log(JSON.stringify({
      ok: false,
      host,
      port,
      security,
      user,
      message: error?.message,
      response: error?.response,
      responseText: error?.responseText,
      code: error?.code,
      serverResponseCode: error?.serverResponseCode,
      authenticationFailed: error?.authenticationFailed,
    }, null, 2));
    process.exit(2);
  } finally {
    try {
      if ((client as any).usable || (client as any).authenticated) await client.logout();
    } catch {
      // Ignore closed sockets.
    }
  }
}

main();
