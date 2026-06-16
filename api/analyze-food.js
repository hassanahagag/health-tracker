export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { foodDescription, userProfile } = req.body;
  
  const prompt = `You are a nutrition expert. Estimate calories and macros for this meal.
User profile: ${userProfile}
Food: ${foodDescription}

Respond ONLY with valid JSON, no markdown:
{"calories": number, "protein": number, "carbs": number, "fat": number, "description": "brief description"}

Be accurate for Egyptian foods (foul, taameya, koshari, etc). Use realistic portions.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 }
      })
    }
  );
  
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch {
    res.status(500).json({ error: 'Parse failed', raw: text });
  }
}
