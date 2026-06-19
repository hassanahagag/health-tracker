export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  try {
    let foodDescription = req.body.foodDescription || 'meal';
    const match = foodDescription.match(/The user ate: "([^"]+)"/);
    if (match) foodDescription = match[1];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Nutrition for "${foodDescription}". JSON only: {"calories":320,"protein":13,"carbs":48,"fat":9,"description":"foul sandwich"}` }] }]
        })
      }
    );
    
    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    if (start !== -1 && end !== -1) {
      const parsed = JSON.parse(text.slice(start, end + 1));
      return res.status(200).json({
        calories: Number(parsed.calories) || 350,
        protein: Number(parsed.protein) || 15,
        carbs: Number(parsed.carbs) || 45,
        fat: Number(parsed.fat) || 10,
        description: parsed.description || foodDescription
      });
    }
    
    // Return raw text so we can see what Gemini sent
    return res.status(200).json({ 
      calories: 350, protein: 15, carbs: 45, fat: 10, 
      description: foodDescription + ' [raw:' + text.slice(0, 100) + ']'
    });
    
  } catch (err) {
    return res.status(200).json({ calories: 350, protein: 15, carbs: 45, fat: 10, description: 'error:' + err.message });
  }
}
