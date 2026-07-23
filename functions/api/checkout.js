// 创建 Stripe Checkout 会话(托管支付页)。
// 价格写死在服务端,前端无法篡改;密钥只从环境变量读取,绝不进代码库。
const PRICE_USD_CENTS = 990; // $9.90
const PRODUCT_NAME = '支持智简历 ☕';

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'server_not_configured' }, { status: 500 });
  }

  const origin = new URL(request.url).origin;

  // 只接受本站页面发起的请求:浏览器跨站 POST 会带上对方的 Origin,直接拒绝
  if (request.headers.get('Origin') !== origin) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][product_data][name]': PRODUCT_NAME,
    'line_items[0][price_data][unit_amount]': String(PRICE_USD_CENTS),
    'line_items[0][quantity]': '1',
    success_url: `${origin}/thanks`,
    cancel_url: `${origin}/`,
  });

  let ok = false;
  let session = null;
  try {
    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      signal: AbortSignal.timeout(10000),
    });
    ok = resp.ok;
    session = await resp.json().catch(() => null);
  } catch {
    // 网络错误或超时:落入下方统一失败出口
  }

  if (!ok || !session?.url) {
    console.error('Stripe checkout error:', session?.error?.message ?? 'network_or_timeout');
    return Response.json({ error: 'checkout_failed' }, { status: 502 });
  }

  return Response.json({ url: session.url });
}

// 非 POST 一律 405,避免落到静态资源兜底
export function onRequest() {
  return Response.json({ error: 'method_not_allowed' }, { status: 405 });
}
