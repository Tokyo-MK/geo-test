export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ① APIキー確認
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'APIキーが未設定です' });
  }

  // ② とりあえずAPIキーの先頭だけ返す（動作確認用）
  return res.status(200).json({
    ok: true,
    keyStart: apiKey.slice(0, 15),
    method: req.method,
    body: req.body
  });
}
