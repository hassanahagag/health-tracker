export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  try {
    let food = req.body.foodDescription || 'meal';
    const match = food.match(/The user ate: "([^"]+)"/);
    if (match) food = match[1];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Nutrition for: ${food}. JSON only: {"calories": 320, "protein": 13, "carbs": 48, "fat": 9, "description": "foul sandwich"}` }] }]
        })
      }
    );
    
    const data = await geminiRes.json();
    const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    const errorMsg = data.error?.message || '';
    
    if (errorMsg) {
      return res.status(200).json({ calories: 1, protein: 1, carbs: 1, fat: 1, description: 'ERROR:' + errorMsg });
    }

    const cal = text.match(/"calories"\s*:\s*(\d+)/)?.[1];
    const pro = text.match(/"protein"\s*:\s*(\d+)/)?.[1];
    const carb = text.match(/"carbs"\s*:\s*(\d+)/)?.[1];
    const fat = text.match(/"fat"\s*:\s*(\d+)/)?.[1];
    const desc = text.match(/"description"\s*:\s*"([^"]+)"/)?.[1];
    
    if (cal) {
      return res.status(200).json({
        calories: parseInt(cal),
        protein: parseInt(pro || 15),
        carbs: parseInt(carb || 45),
        fat: parseInt(fat || 10),
        description: desc || food
      });
    }
    
    return res.status(200).json({ calories: 2, protein: 2, carbs: 2, fat: 2, description: 'NO_JSON:' + text.slice(0, 100) });
    
  } catch (err) {
    return res.status(200).json({ calories: 4, protein: 4, carbs: 4, fat: 4, description: 'CATCH:' + err.message });
  }
}
