export function newsletterTemplate(subject: string, bodyHtml: string, unsubscribeUrl: string): string {
  const safeBody = bodyHtml.replace(/<script[^>]*>.*?<\/script>/gi, "");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06)">
<tr><td style="background:#012169;padding:32px;text-align:center">
<img src="https://placehold.co/40x40/ffffff/012169?text=BC" width="40" height="40" alt="BritCRM" style="border-radius:12px;margin-bottom:12px">
<h1 style="color:#fff;font-size:20px;font-weight:900;margin:0">${subject}</h1>
</td></tr>
<tr><td style="padding:32px">
<div style="font-size:14px;line-height:1.7;color:#52525b">${safeBody}</div>
</td></tr>
<tr><td style="padding:32px;text-align:center;border-top:1px solid #e4e4e7">
<p style="font-size:11px;color:#a1a1aa;margin:0 0 4px">BritCRM &mdash; BritSync AI Ltd</p>
<p style="font-size:11px;color:#a1a1aa;margin:4px 0">
<a href="${unsubscribeUrl}" style="color:#c8102e;text-decoration:underline;font-weight:700">Unsubscribe</a>
&nbsp;|&nbsp;
<a href="${baseUrl}/login" style="color:#012169;text-decoration:underline">Subscribe</a>
</p>
<p style="font-size:10px;color:#a1a1aa;margin:8px 0 0">You received this because you have a BritCRM account.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
