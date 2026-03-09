const { ImapFlow } = require('imapflow');

const client = new ImapFlow({
  host: 'mail.livemail.co.uk',
  port: 993,
  secure: true,
  auth: { user: 'vip@softpros.co.uk', pass: 'Sp2025@pak' },
  logger: false
});

async function run() {
  await client.connect();
  const list = await client.list();
  for (let mb of list) {
    console.log(`Path: ${mb.path}, Name: ${mb.name}, SpecialUse: ${mb.specialUse}`);
  }
  await client.logout();
}

run().catch(console.error);
