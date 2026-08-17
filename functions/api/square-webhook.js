const WEBHOOK_URL = 'https://cymatiquelab.com/api/square-webhook';
const META_DATASET_ID = '1604448031073152';
const META_GRAPH_VERSION = 'v25.0';
// Redeploy marker: pick up META_TEST_EVENT_CODE from Cloudflare Production.

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

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeCompact(value) {
  return normalize(value).replace(/[^a-z0-9]/g, '');
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function addHashed(target, key, value, compact = false) {
  const normalized = compact ? normalizeCompact(value) : normalize(value);
  if (normalized) target[key] = [await sha256(normalized)];
}

async function buildMetaUserData(payment) {
  const userData = {};

  await addHashed(userData, 'em', payment?.buyer_email_address);
  await addHashed(userData, 'external_id', payment?.customer_id);

  const address = payment?.billing_address || {};
  await addHashed(userData, 'fn', address.first_name, true);
  await addHashed(userData, 'ln', address.last_name, true);
  await addHashed(userData, 'ct', address.locality, true);
  await addHashed(userData, 'st', address.administrative_district_level_1, true);
  await addHashed(userData, 'zp', address.postal_code, true);
  await addHashed(userData, 'country', address.country, true);

  return userData;
}

function unixSeconds(value) {
  const ms = Date.parse(value || '');
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : Math.floor(Date.now() / 1000);
}

async function sendMetaPurchase(context, event, payment) {
  const accessToken = context.env.META_CAPI_ACCESS_TOKEN;
  if (!accessToken) {
    return { ok: false, skipped: true, reason: 'missing_meta_token' };
  }

  const amount = payment?.total_money?.amount ?? payment?.amount_money?.amount;
  const currency = payment?.total_money?.currency ?? payment?.amount_money?.currency;

  if (!Number.isFinite(amount) || !currency || !payment?.id) {
    return { ok: false, skipped: true, reason: 'missing_payment_fields' };
  }

  const userData = await buildMetaUserData(payment);
  if (Object.keys(userData).length === 0) {
    return { ok: false, skipped: true, reason: 'no_customer_match_data' };
  }

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: unixSeconds(event?.created_at || payment?.updated_at || payment?.created_at),
        event_id: `square:${payment.id}`,
        action_source: 'other',
        user_data: userData,
        custom_data: {
          value: amount / 100,
          currency: String(currency).toUpperCase(),
          order_id: payment?.order_id || payment.id
        }
      }
    ]
  };

  // Optional: add META_TEST_EVENT_CODE as a Cloudflare variable/secret when
  // testing in Meta Events Manager. Remove it after validation to send live data.
  if (context.env.META_TEST_EVENT_CODE) {
    payload.test_event_code = context.env.META_TEST_EVENT_CODE;
  }

  const endpoint = `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_DATASET_ID}/events`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  let body;
  try {
    body = await response.json();
  } catch (_) {
    body = { raw: await response.text().catch(() => '') };
  }

  return {
    ok: response.ok,
    status: response.status,
    events_received: body?.events_received ?? null,
    fbtrace_id: body?.fbtrace_id ?? null,
    error: response.ok ? null : body?.error?.message || 'meta_request_failed'
  };
}

export async function onRequestGet(context) {
  return json({
    ok: true,
    service: 'CymatiqueLab Square -> Meta CAPI webhook',
    square_signature: context.env.SQUARE_WEBHOOK_SIGNATURE_KEY ? 'ready' : 'missing',
    meta_capi: context.env.META_CAPI_ACCESS_TOKEN ? 'ready' : 'missing',
    meta_test_mode: Boolean(context.env.META_TEST_EVENT_CODE),
    notification_url: WEBHOOK_URL
  });
}

export async function onRequestPost(context) {
  const rawBody = await context.request.text();
  const signatureKey = context.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

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
  const isCompletedPayment = event?.type === 'payment.updated' && payment?.status === 'COMPLETED';

  if (!isCompletedPayment) {
    return json({
      received: true,
      verified: true,
      processed: false,
      event_type: event?.type || null,
      payment_status: payment?.status || null
    });
  }

  const meta = await sendMetaPurchase(context, event, payment);

  // Square can send more than one payment.updated notification after a payment
  // is complete. Meta deduplicates them because every Purchase uses the stable
  // event_id `square:<payment.id>`.
  if (!meta.ok && !meta.skipped) {
    return json({
      received: true,
      verified: true,
      processed: false,
      meta
    }, 502);
  }

  return json({
    received: true,
    verified: true,
    processed: Boolean(meta.ok),
    payment_id: payment.id,
    meta
  });
}
