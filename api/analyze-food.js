export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  try {
    let food = req.body.foodDescription || 'meal';
    const match = food.match(/The user ate: "([^"]+)"/);
    if (match) food = match[1];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Nutrition for: ${food}. JSON only: {"calories": 320, "protein": 13, "carbs": 48, "fat": 9, "description": "foul sandwich"}` }] }]
        })
      }
    );
    
    const data = await geminiRes.json();
    
    // Return the FULL Gemini response so we can debug
    return res.status(200).json({
      calories: 999,
      protein: 99,
      carbs: 99,
      fat: 99,
      description: JSON.stringify(data).slice(0, 500)
    });
    
  } catch (err) {
    return res.status(200).json({ calories: 888, protein: 88, carbs: 88, fat: 88, description: err.message });
  }
}
