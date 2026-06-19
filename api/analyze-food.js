export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  try {
    let foodDescription = req.body.foodDescription || 'meal';
    
    // Extract food name if full prompt was sent
    const match = foodDescription.match(/The user ate: "([^"]+)"/);
    if (match) foodDescription = match[1];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a nutrition database. Return ONLY a JSON object with nutrition for: "${foodDescription}"
Format: {"calories":320,"protein":13,"carbs":48,"fat":9,"description":"foul sandwich"}
Numbers only, no units. Accurate Egyptian food portions if applicable.`
            }]
          }]
        })
      }
    );
    
    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Find JSON in response
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    if (start !== -1 && end !== -1) {
      const parsed = JSON.parse(text.slice(start, end + 1));
      if (parsed.calories) {
        return res.status(200).json(parsed);
      }
    }
    
    // If parsing failed, return debug info
    return res.status(200).json({ 
      calories: 350, protein: 15, carbs: 45, fat: 10, 
      description: foodDescription,
      debug: text.slice(0, 300)
    });
    
  } catch (err) {
    return res.status(200).json({ calories: 350, protein: 15, carbs: 45, fat: 10, description: 'meal' });
  }
}
