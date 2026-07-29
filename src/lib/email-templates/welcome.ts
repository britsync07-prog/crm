export function welcomeEmailTemplate(name: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
<style>
  @media only screen and (max-width:480px){
    .container{width:100%!important;max-width:100%!important}
    .body{padding:32px 20px!important}
    .header{padding:32px 20px!important}
    .footer{padding:24px 20px!important}
    .btn{display:block!important;text-align:center!important;padding:14px 24px!important;font-size:14px!important}
    .feature-cell{display:block!important;width:100%!important;padding:4px 0!important}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px" bgcolor="#f4f4f5">
<tr><td align="center">
<table class="container" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.08)" bgcolor="#fff">
<tr><td class="header" style="background:linear-gradient(135deg,#012169,#c8102e);padding:40px 32px;text-align:center">
  <h1 style="color:#fff;font-size:28px;font-weight:900;margin:0;letter-spacing:-.5px;text-shadow:0 1px 2px rgba(0,0,0,.1)">BritCRM</h1>
  <p style="color:rgba(255,255,255,.85);font-size:15px;margin:10px 0 0;font-weight:400">Welcome aboard!</p>
</td></tr>
<tr><td class="body" style="padding:40px 32px">
  <h2 style="font-size:18px;font-weight:800;color:#18181b;margin:0 0 6px">Hi ${name},</h2>
  <p style="font-size:14px;line-height:1.7;color:#52525b;margin:0 0 24px">Thanks for signing up! You now have access to everything BritCRM has to offer — from CRM and project management to team collaboration and automation.</p>

  <table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td class="feature-cell" width="50%" style="padding:4px;vertical-align:top">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fa;border-radius:12px">
      <tr><td style="padding:16px;text-align:center">
        <p style="font-size:13px;font-weight:800;color:#012169;margin:0;text-transform:uppercase;letter-spacing:.5px">CRM & Sales</p>
        <p style="font-size:12px;color:#71717a;margin:4px 0 0;line-height:1.4">Manage leads, deals & customers</p>
      </td></tr></table>
    </td>
    <td class="feature-cell" width="50%" style="padding:4px;vertical-align:top">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fa;border-radius:12px">
      <tr><td style="padding:16px;text-align:center">
        <p style="font-size:13px;font-weight:800;color:#012169;margin:0;text-transform:uppercase;letter-spacing:.5px">Projects</p>
        <p style="font-size:12px;color:#71717a;margin:4px 0 0;line-height:1.4">Track tasks & timelines</p>
      </td></tr></table>
    </td>
  </tr>
  <tr>
    <td class="feature-cell" width="50%" style="padding:4px;vertical-align:top">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fa;border-radius:12px">
      <tr><td style="padding:16px;text-align:center">
        <p style="font-size:13px;font-weight:800;color:#012169;margin:0;text-transform:uppercase;letter-spacing:.5px">Team</p>
        <p style="font-size:12px;color:#71717a;margin:4px 0 0;line-height:1.4">Collaborate in workspaces</p>
      </td></tr></table>
    </td>
    <td class="feature-cell" width="50%" style="padding:4px;vertical-align:top">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fa;border-radius:12px">
      <tr><td style="padding:16px;text-align:center">
        <p style="font-size:13px;font-weight:800;color:#012169;margin:0;text-transform:uppercase;letter-spacing:.5px">Automation</p>
        <p style="font-size:12px;color:#71717a;margin:4px 0 0;line-height:1.4">Workflows & email campaigns</p>
      </td></tr></table>
    </td>
  </tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px">
  <tr><td align="center" style="padding:4px 0 20px">
    <table cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="background:#012169;border-radius:12px;padding:0;box-shadow:0 4px 12px rgba(1,33,105,.3)" bgcolor="#012169">
        <a href="${baseUrl}/login" class="btn" style="display:inline-block;padding:14px 40px;font-size:15px;font-weight:700;color:#fff;text-decoration:none;letter-spacing:.3px;white-space:nowrap">Get Started</a>
      </td>
    </tr>
    </table>
  </td></tr>
  </table>

  <p style="font-size:13px;line-height:1.6;color:#71717a;margin:0 0 4px">If the button doesn't work, copy and paste this link into your browser:</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:8px" bgcolor="#f4f4f5">
  <tr><td style="padding:12px 16px">
    <p style="font-size:12px;line-height:1.5;color:#52525b;margin:0;word-break:break-all;font-family:monospace">${baseUrl}/login</p>
  </td></tr>
  </table>
</td></tr>
<tr><td class="footer" style="padding:32px;text-align:center;border-top:1px solid #e4e4e7" bgcolor="#fafafa">
  <p style="font-size:12px;color:#a1a1aa;margin:0 0 4px;font-weight:600">BritCRM &mdash; BritSync AI Ltd</p>
  <p style="font-size:12px;color:#a1a1aa;margin:0">Questions? <a href="mailto:support@britsyncai.com" style="color:#012169;text-decoration:none;font-weight:600">support@britsyncai.com</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
