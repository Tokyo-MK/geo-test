export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { level } = req.body;
  if (!level || level < 1 || level > 10) {
    return res.status(400).json({ error: 'Invalid level' });
  }

  const levelDesc = [
    '', // index 0 unused
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
  ][level];

  const prompt = `あなたは東京MKタクシーのドライバー研修担当です。
レベル${level}（難易度${level}/10）のドライバー向け地理知識クイズを10問作成してください。

【このレベルのテーマ】
${levelDesc}

【出力形式】
必ずJSON配列のみを返してください。前後に説明文や\`\`\`は不要です。
各問題は以下の形式：
{
  "type": "ox" または "choice",
  "q": "問題文",
  "a": "正解",
  "choices": ["選択肢A","選択肢B","選択肢C","選択肢D"],  // choiceのみ。oxの場合は省略
  "explain": "解説文（50〜100字）"
}

【注意】
- 実際に存在する正確な情報のみ使用すること
- oxの場合 "a" は "○" または "×" のみ
- choiceの場合 "a" は choices の中の1つと完全一致させること
- 問題は実務で役立つ内容にすること
- レベルが高いほど難しく、細かい知識を問うこと
- 10問のうち ox: 4問、choice: 6問 の比率にすること`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: 'API error', detail: err });
    }

    const data = await response.json();
    const text = data.content[0].text.trim();

    // JSONパース（```で囲まれていても対応）
    const clean = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    const questions = JSON.parse(clean);

    return res.status(200).json({ questions });
  } catch (e) {
    return res.status(500).json({ error: 'Parse error', detail: e.message });
  }
}
