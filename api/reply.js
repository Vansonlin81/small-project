const ALLOWED_ORIGIN = 'https://vansonlin81.github.io';
const VALID_DATES = new Set(['2026-10-09','2026-10-10']);

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Invite-Token');
}

function bad(res, status, error) {
  return res.status(status).json({ error });
}

function validate(body) {
  if (!body || typeof body !== 'object') throw new Error('請確認回信內容。');
  const { response, slots, place, message } = body;
  if (!['yes','later'].includes(response)) throw new Error('回覆選項不正確。');
  if (!Array.isArray(slots) || slots.length > 31) throw new Error('日期資料不正確。');
  if (typeof place !== 'string' || place.length > 200) throw new Error('地點內容過長。');
  if (typeof message !== 'string' || message.length > 2000) throw new Error('留言內容過長。');

  const cleaned = slots.map((slot) => {
    if (!slot || typeof slot.date !== 'string' || !/^2026-10-(0[1-9]|[12]\d|3[01])$/.test(slot.date)) {
      throw new Error('日期格式不正確。');
    }
    if (!Array.isArray(slot.times) || slot.times.length < 1 || slot.times.length > 3) {
      throw new Error('時段資料不正確。');
    }
    const allowedTimes = slot.date === '2026-10-09'
      ? ['中午','晚上']
      : slot.date === '2026-10-10'
        ? ['中午']
        : ['中午','下午','晚上'];
    if (slot.times.some((t) => !allowedTimes.includes(t))) throw new Error('包含不正確的時段。');
    return { date: slot.date, times: [...new Set(slot.times)] };
  });

  if (response === 'yes' && cleaned.length === 0) throw new Error('請至少選一天，或選擇「時間再一起商量」。');
  return {
    response,
    slots: response === 'later' ? [] : cleaned.sort((a,b) => a.date.localeCompare(b.date)),
    place: place.trim(),
    message: message.trim(),
  };
}

function formatReply(reply) {
  const status = reply.response === 'yes' ? '准許攜糕出席' : '時間再一起商量';
  const slots = reply.slots.length
    ? reply.slots.map((s) => `${s.date} ${s.times.join('、')}`).join('\n')
    : '未指定';
  return [
    '生日邀約收到新回覆',
    '',
    `回覆：${status}`,
    `時間：${slots}`,
    `地點：${reply.place || '未填寫'}`,
    `留言：${reply.message || '未填寫'}`,
    '',
    `收到時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`,
  ].join('\n');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return bad(res, 405, 'Method not allowed');

  const origin = req.headers.origin || '';
  if (origin !== ALLOWED_ORIGIN) return bad(res, 403, 'Origin not allowed');

  const expectedToken = process.env.INVITE_TOKEN || '';
  const providedToken = req.headers['x-invite-token'] || '';
  if (!expectedToken || providedToken !== expectedToken) return bad(res, 403, 'Invalid invite token');

  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !process.env.EMAIL_TO) {
    return bad(res, 500, 'Email service is not configured');
  }

  let reply;
  try {
    reply = validate(req.body);
  } catch (err) {
    return bad(res, 400, err instanceof Error ? err.message : '請確認回信內容。');
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [process.env.EMAIL_TO],
        subject: '妗嬅回覆了生日邀約 💌',
        text: formatReply(reply),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Resend error', response.status, data);
      return bad(res, 502, '回信已送出，但 Email 暫時寄送失敗。');
    }

    return res.status(200).json({ reply: { ...reply, emailStatus: 'accepted' }, emailId: data.id || null });
  } catch (err) {
    console.error('Reply API error', err);
    return bad(res, 500, '寄信服務暫時無法使用。');
  }
}
