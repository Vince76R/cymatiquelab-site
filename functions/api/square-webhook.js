const WEBHOOK_URL = 'https://cymatiquelab.com/api/square-webhook';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function base64ToBytes(value) {
  try {
    const binary = atob(value || '');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch (_) {
    return new Uint8Array(0);
  }
}

function constantTimeEqual(a, b) {
  const max = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < max; i += 1) {
    const av = i < a.length ? a[i] : 0;
    const bv = i < b.length ? b[i] : 0;
    diff |= av ^ bv;
  }
  return diff === 0;
}

async function verifySquareSignature(signatureHeader, rawBody, signatureKey) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(signatureKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signed = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(WEBHOOK_URL + rawBody)
  );
  return constantTimeEqual(new Uint8Array(signed), base64ToBytes(signatureHeader));
}

export async function onRequestGet(context) {
  return json({
    ok: true,
    service: 'CymatiqueLab Square webhook',
    mode: context.env.SQUARE_WEBHOOK_SIGNATURE_KEY ? 'signature-ready' : 'setup',
    notification_url: WEBHOOK_URL
  });
}

export async function onRequestPost(context) {
  const rawBody = await context.request.text();
  const signatureKey = context.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

  // Safe setup mode: acknowledge Square's endpoint checks, but do not process
  // or forward any payment data until the signature key is stored in Cloudflare.
  if (!signatureKey) {
    return json({ received: true, processed: false, mode: 'setup' });
  }

  const signature = context.request.headers.get('x-square-hmacsha256-signature') || '';
  const valid = await verifySquareSignature(signature, rawBody, signatureKey);
  if (!valid) return json({ error: 'invalid_signature' }, 403);

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (_) {
    return json({ error: 'invalid_json' }, 400);
  }

  const payment = event?.data?.object?.payment;
  const isPaymentEvent = event?.type === 'payment.created' || event?.type === 'payment.updated';
  const isCompleted = payment?.status === 'COMPLETED';

  // Signature validation is live. Meta Purchase forwarding will be enabled only
  // after the Meta server credential is stored as an encrypted Cloudflare secret.
  return json({
    received: true,
    verified: true,
    processed: false,
    event_type: event?.type || null,
    completed_payment: Boolean(isPaymentEvent && isCompleted)
  });
}
