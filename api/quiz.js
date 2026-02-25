export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'APIキーが未設定です' });

  const { level } = req.body || {};
  if (!level) return res.status(400).json({ error: 'levelがありません' });

  const levelDesc = [
    '',
    '主要ランドマーク（東京タワー、スカイツリー、浅草寺など）の区・住所',
    '主要駅（山手線各駅）の所在区と周辺の主要施設',
    '羽田・成田空港のターミナル構成と主要航空会社の使用ターミナル',
    '幹線道路（国道・都道）の名称と通過エリア',
    '都内の橋（レインボーブリッジ、勝鬨橋など）の位置と接続区',
    '区境・境界線の知識（〇〇区と△△区の境界となる道路・川）',
    '都内の主要ホテル・式場の正確な住所と最寄り出口',
    '有名企業の本社所在地と最寄り駅・出口',
    '細街路・裏道・近道の知識（渋滞回避ルート）',
    '最難関：特定の番地・ビル名・出入口まで含む精密な地理知識',
  ][level] || '東京都内の地理知識';

  const prompt = `あなたは東京MKタクシーのドライバー研修担当です。
レベル${level}（難易度${level}/10）のドライバー向け地理知識クイズを10問作成してください。

【このレベルのテーマ】
${levelDesc}

【出力形式】
必ずJSON配列のみを返してください。前後に説明文やマークダウンの\`\`\`は絶対に含めないでください。
配列の最初の文字は [ で、最後の文字は ] にしてください。

各問題の形式：
[
  {
    "type": "ox",
    "q": "問題文",
    "a": "○",
    "explain": "解説文（50〜100字）"
  },
  {
    "type": "choice",
    "q": "問題文",
    "choices": ["選択肢A","選択肢B","選択肢C","選択肢D"],
    "a": "選択肢A",
    "explain": "解説文（50〜100字）"
  }
]

【ルール】
- 実際に存在する正確な情報のみ使用
- oxの "a" は "○" または "×" のみ
- choiceの "a" は choices の中の1つと完全一致
- 10問のうち ox: 4問、choice: 6問
- レベルが高いほど難しく細かい知識を問うこと`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic error:', JSON.stringify(data));
      return res.status(500).json({ error: 'Anthropic APIエラー', detail: data });
    }

    const raw = data.content?.[0]?.text || '';
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) {
      return res.status(500).json({ error: 'JSONが見つかりません', raw: raw.slice(0, 500) });
    }

    const questions = JSON.parse(match[0]);
    return res.status(200).json({ questions });

  } catch (e) {
    console.error('Error:', e);
    return res.status(500).json({ error: e.message });
  }
}
