export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  try {
    const body = req.body;
    
    // Extract just the food name from whatever was sent
    let foodDescription = body.foodDescription || body || '';
    if (typeof foodDescription !== 'string') foodDescription = JSON.stringify(foodDescription);
    
    // If it contains the prompt text, extract just the food part
    const match = foodDescription.match(/The user ate: "([^"]+)"/);
    if (match) foodDescription = match[1];
    
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Nutrition facts for: ${foodDescription}. Reply with only JSON: {"calories":300,"protein":15,"carbs":40,"fat":10,"description":"food name"}` }] }]
        })
      }
    );
    
    const raw = await geminiRes.text();
    const data = JSON.parse(raw);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    if (start === -1) {
      return res.status(200).json({ calories: 300, protein: 15, carbs: 40, fat: 10, description: foodDescription });
    }
    
    const parsed = JSON.parse(text.slice(start, end + 1));
    return res.status(200).json(parsed);
    
  } catch (err) {
    return res.status(200).json({ calories: 300, protein: 15, carbs: 40, fat: 10, description: 'meal', error: err.message });
  }
}
