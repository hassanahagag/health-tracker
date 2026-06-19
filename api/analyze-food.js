export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { foodDescription, userProfile } = req.body;
  
  const prompt = `Estimate nutrition for: ${foodDescription}
Respond with only this JSON (no other text):
{"calories":350,"protein":15,"carbs":40,"fat":12,"description":"meal name"}`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );
    
    const data = await geminiRes.json();
    
    if (!geminiRes.ok) {
      return res.status(500).json({ error: 'Gemini error', detail: JSON.stringify(data) });
    }
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    if (start === -1 || end === -1) {
      return res.status(500).json({ error: 'No JSON found', raw: text });
    }
    
    const parsed = JSON.parse(text.slice(start, end + 1));
    return res.status(200).json(parsed);
    
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
