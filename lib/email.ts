import 'server-only';
import { Resend } from 'resend';
import { SITE_URL } from './env';
import { naira } from './format';

const FROM = process.env.EMAIL_FROM || 'HOLASKEY <orders@holaskey.com>';
export const OWNER_EMAIL = process.env.OWNER_EMAIL || '';

let resend: Resend | null = null;
function client() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Branded layout: onyx background, bone text, wordmark, terracotta signature sign-off. */
function layout(opts: { heading: string; body: string; cta?: { label: string; href: string } }) {
  const cta = opts.cta
    ? `<tr><td style="padding:8px 0 24px"><a href="${opts.cta.href}" style="display:inline-block;background:#F3ECE2;color:#120D0A;font-family:'IBM Plex Mono',Menlo,monospace;font-size:12px;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;padding:16px 28px">${esc(opts.cta.label)}</a></td></tr>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#120D0A;color:#F3ECE2;font-family:Inter,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#120D0A"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 0 32px;border-bottom:1px solid #3A2D24"><img src="${SITE_URL}/wordmark-bone.png" width="140" alt="HOLASKEY" style="display:block"></td></tr>
<tr><td style="padding:32px 0 12px;font-family:Archivo,'Arial Narrow',sans-serif;font-weight:800;font-size:32px;line-height:1;text-transform:uppercase">${esc(opts.heading)}</td></tr>
<tr><td style="padding:0 0 16px;font-size:16px;line-height:1.6;color:#F3ECE2">${opts.body}</td></tr>
${cta}
<tr><td style="padding:8px 0 32px"><img src="${SITE_URL}/signature.png" width="90" alt="HOLASKEY" style="display:block"></td></tr>
<tr><td style="padding:20px 0 0;border-top:1px solid #3A2D24;font-family:'IBM Plex Mono',Menlo,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#9C8F82">HOLASKEY · Lagos</td></tr>
</table></td></tr></table></body></html>`;
}

async function send(to: string | string[], subject: string, html: string) {
  const c = client();
  const list = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!c || !list.length) {
    console.info(`[email skipped] ${subject} → ${list.join(', ') || '(no recipient)'}`);
    return;
  }
  try {
    await c.emails.send({ from: FROM, to: list, subject, html });
  } catch (e) {
    console.error('[email failed]', subject, e);
  }
}

type Line = { title: string; size: string; colour: string; qty: number; unit_price: number };
const lineRows = (lines: Line[]) =>
  lines
    .map((l) => `${esc(l.title)} — ${esc(l.size)} · ${esc(l.colour)} × ${l.qty} — <b>${naira(l.unit_price * l.qty)}</b>`)
    .join('<br>');

export const emails = {
  orderPaid(to: string, o: { number: string; id: string; total: number; lines: Line[]; name: string }) {
    return send(
      to,
      `Order ${o.number} confirmed`,
      layout({
        heading: 'Order confirmed.',
        body: `Thanks${o.name ? ', ' + esc(o.name.split(' ')[0]) : ''}. We've got your payment and we're getting it ready.<br><br>${lineRows(o.lines)}<br><br>Total paid: <b>${naira(o.total)}</b>`,
        cta: { label: 'Track order', href: `${SITE_URL}/account/orders/${o.id}` },
      }),
    );
  },
  orderPaidOwner(o: { number: string; id: string; total: number; lines: Line[]; outOfStock: boolean }) {
    return send(
      OWNER_EMAIL,
      `${o.outOfStock ? 'ACTION: out of stock — ' : 'New order '}${o.number} · ${naira(o.total)}`,
      layout({
        heading: o.outOfStock ? 'Paid, out of stock' : 'New order',
        body: `${o.outOfStock ? 'An item sold out before this payment landed. Refund or offer a swap.<br><br>' : ''}${lineRows(o.lines)}<br><br>Total: <b>${naira(o.total)}</b>`,
        cta: { label: 'Open in admin', href: `${SITE_URL}/admin/orders/${o.id}` },
      }),
    );
  },
  orderStatus(to: string, o: { number: string; id: string; status: 'shipped' | 'delivered' | 'processing'; note?: string | null }) {
    const copy = {
      processing: ['We’re on it.', `Order ${o.number} is being packed.`],
      shipped: ['On its way.', `Order ${o.number} has shipped.`],
      delivered: ['Delivered.', `Order ${o.number} has been delivered. Wear it well.`],
    }[o.status];
    return send(
      to,
      `Order ${o.number}: ${o.status}`,
      layout({
        heading: copy[0],
        body: `${copy[1]}${o.note ? `<br><br>${esc(o.note)}` : ''}`,
        cta: { label: 'View order', href: `${SITE_URL}/account/orders/${o.id}` },
      }),
    );
  },
  customReceived(to: string, r: { number: string; id: string }) {
    return send(
      to,
      `Request ${r.number} received`,
      layout({
        heading: 'Request received.',
        body: `We'll send your quote within 48 hours. You can follow it and message us from your account.`,
        cta: { label: 'View request', href: `${SITE_URL}/account/custom/${r.id}` },
      }),
    );
  },
  customReceivedOwner(r: { number: string; id: string; kind: string; item_type: string; customer: string }) {
    return send(
      OWNER_EMAIL,
      `New custom request ${r.number} · ${r.item_type}`,
      layout({
        heading: 'New custom request',
        body: `${esc(r.customer)} wants a ${esc(r.kind)} piece: <b>${esc(r.item_type)}</b>.`,
        cta: { label: 'Open request', href: `${SITE_URL}/admin/custom/${r.id}` },
      }),
    );
  },
  quoteReady(to: string, r: { number: string; id: string; total: number; days: number | null; expires: string }) {
    return send(
      to,
      `Your quote for ${r.number} is ready`,
      layout({
        heading: 'Your quote is ready.',
        body: `Total <b>${naira(r.total)}</b>${r.days ? `, ready in about ${r.days} days after payment` : ''}.<br>The quote is valid until ${esc(r.expires)}.`,
        cta: { label: `Pay ${naira(r.total)}`, href: `${SITE_URL}/account/custom/${r.id}` },
      }),
    );
  },
  needsInfo(to: string, r: { number: string; id: string; question: string }) {
    return send(
      to,
      `A question about ${r.number}`,
      layout({
        heading: 'Quick question.',
        body: esc(r.question),
        cta: { label: 'Reply', href: `${SITE_URL}/account/custom/${r.id}` },
      }),
    );
  },
  quoteExpiring(to: string, r: { number: string; id: string; total: number }) {
    return send(
      to,
      `Your quote for ${r.number} expires tomorrow`,
      layout({
        heading: 'Last day for your quote.',
        body: `Your quote of <b>${naira(r.total)}</b> expires in 24 hours.`,
        cta: { label: 'Pay now', href: `${SITE_URL}/account/custom/${r.id}` },
      }),
    );
  },
  customPaid(to: string, r: { number: string; id: string; total: number }) {
    return send(
      to,
      `${r.number} paid — we're making it`,
      layout({
        heading: 'Paid. We’re making it.',
        body: `We've received ${naira(r.total)}. We'll post progress photos on your request as we go.`,
        cta: { label: 'View request', href: `${SITE_URL}/account/custom/${r.id}` },
      }),
    );
  },
  customPaidOwner(r: { number: string; id: string; total: number }) {
    return send(
      OWNER_EMAIL,
      `Custom ${r.number} paid · ${naira(r.total)}`,
      layout({ heading: 'Custom order paid', body: `Start production.`, cta: { label: 'Open request', href: `${SITE_URL}/admin/custom/${r.id}` } }),
    );
  },
  customStatus(to: string, r: { number: string; id: string; label: string; note?: string | null }) {
    return send(
      to,
      `${r.number}: ${r.label}`,
      layout({
        heading: r.label + '.',
        body: `Your custom order ${esc(r.number)} is now <b>${esc(r.label.toLowerCase())}</b>.${r.note ? `<br><br>${esc(r.note)}` : ''}`,
        cta: { label: 'View request', href: `${SITE_URL}/account/custom/${r.id}` },
      }),
    );
  },
  newMessage(to: string, r: { number: string; href: string; from: string }) {
    return send(
      to,
      `New message on ${r.number}`,
      layout({ heading: 'New message', body: `${esc(r.from)} replied on ${esc(r.number)}.`, cta: { label: 'Open', href: r.href } }),
    );
  },
};
