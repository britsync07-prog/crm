const MailComposer = require('nodemailer/lib/mail-composer');
const composer = new MailComposer({from: 'test@t.com', subject: 'test', text: 'hi'});
composer.compile().build((err, msg) => {
  console.log(msg.toString());
});
