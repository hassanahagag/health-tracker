export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { foodDescription, userProfile } = req.body;
  
  const prompt = `You are a nutrition expert. Estimate calories and macros for this meal.
User profile: ${userProfile}
Food: ${foodDescription}

You MUST respond with ONLY this JSON and nothing else:
{"calories": 350, "protein": 15, "carbs": 40, "fat": 12, "description": "meal name here"}

Replace the numbers with your actual estimates. No markdown, no explanation, just the JSON.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
        })
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(500).json({ error: 'Gemini API error', detail: data });
    }
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
