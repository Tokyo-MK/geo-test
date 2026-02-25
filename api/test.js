export default function handler(req, res) {
  const key = process.env.ANTHROPIC_API_KEY;
  res.status(200).json({
    hasKey: !!key,
    keyStart: key ? key.slice(0, 12) : 'なし'
  });
}
```

commitしてデプロイ後に：
```
https://geo-test-opal.vercel.app/api/test
