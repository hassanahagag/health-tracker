const NUTRITION_DB = {
  // Egyptian foods
  'foul': { calories: 320, protein: 13, carbs: 48, fat: 9 },
  'fool': { calories: 320, protein: 13, carbs: 48, fat: 9 },
  'taameya': { calories: 380, protein: 11, carbs: 45, fat: 17 },
  'falafel': { calories: 380, protein: 11, carbs: 45, fat: 17 },
  'koshari': { calories: 550, protein: 16, carbs: 95, fat: 12 },
  'koshary': { calories: 550, protein: 16, carbs: 95, fat: 12 },
  'molokhia': { calories: 180, protein: 4, carbs: 12, fat: 12 },
  'baladi': { calories: 160, protein: 5, carbs: 32, fat: 1 },
  'hawawshi': { calories: 520, protein: 28, carbs: 38, fat: 28 },
  'shawarma': { calories: 450, protein: 28, carbs: 38, fat: 18 },
  'kebab': { calories: 400, protein: 32, carbs: 8, fat: 26 },
  'kofta': { calories: 380, protein: 28, carbs: 10, fat: 26 },
  'mahshi': { calories: 320, protein: 8, carbs: 45, fat: 12 },
  'feteer': { calories: 480, protein: 10, carbs: 58, fat: 22 },
  'fattah': { calories: 520, protein: 22, carbs: 65, fat: 18 },
  // Proteins
  'egg': { calories: 78, protein: 6, carbs: 1, fat: 5 },
  'eggs': { calories: 78, protein: 6, carbs: 1, fat: 5 },
  'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 4 },
  'grilled chicken': { calories: 220, protein: 38, carbs: 0, fat: 7 },
  'chicken': { calories: 250, protein: 35, carbs: 0, fat: 12 },
  'tuna': { calories: 180, protein: 30, carbs: 0, fat: 6 },
  'salmon': { calories: 400, protein: 40, carbs: 0, fat: 26 },
  'beef': { calories: 320, protein: 30, carbs: 0, fat: 22 },
  'steak': { calories: 380, protein: 36, carbs: 0, fat: 26 },
  'turkey': { calories: 180, protein: 28, carbs: 0, fat: 7 },
  'shrimp': { calories: 160, protein: 24, carbs: 2, fat: 5 },
  'fish': { calories: 200, protein: 28, carbs: 0, fat: 10 },
  // Carbs
  'rice': { calories: 200, protein: 4, carbs: 44, fat: 1 },
  'pasta': { calories: 220, protein: 8, carbs: 43, fat: 2 },
  'bread': { calories: 160, protein: 5, carbs: 30, fat: 2 },
  'toast': { calories: 80, protein: 3, carbs: 15, fat: 1 },
  'potato': { calories: 160, protein: 4, carbs: 37, fat: 0 },
  'sweet potato': { calories: 130, protein: 2, carbs: 30, fat: 0 },
  'oats': { calories: 300, protein: 10, carbs: 54, fat: 6 },
  'tortilla': { calories: 150, protein: 4, carbs: 26, fat: 4 },
  // Dairy
  'yogurt': { calories: 120, protein: 10, carbs: 12, fat: 4 },
  'greek yogurt': { calories: 130, protein: 17, carbs: 7, fat: 4 },
  'milk': { calories: 90, protein: 8, carbs: 12, fat: 2 },
  'cheese': { calories: 200, protein: 12, carbs: 2, fat: 16 },
  'cottage cheese': { calories: 110, protein: 14, carbs: 4, fat: 5 },
  'feta': { calories: 140, protein: 8, carbs: 2, fat: 11 },
  'cheddar': { calories: 220, protein: 13, carbs: 1, fat: 18 },
  // Vegetables
  'salad': { calories: 60, protein: 2, carbs: 8, fat: 3 },
  'vegetables': { calories: 80, protein: 3, carbs: 12, fat: 2 },
  'broccoli': { calories: 55, protein: 4, carbs: 11, fat: 1 },
  'spinach': { calories: 40, protein: 4, carbs: 5, fat: 1 },
  'cucumber': { calories: 20, protein: 1, carbs: 4, fat: 0 },
  'tomato': { calories: 35, protein: 2, carbs: 7, fat: 0 },
  // Fruits
  'apple': { calories: 95, protein: 0, carbs: 25, fat: 0 },
  'banana': { calories: 105, protein: 1, carbs: 27, fat: 0 },
  'orange': { calories: 80, protein: 1, carbs: 19, fat: 0 },
  'mango': { calories: 135, protein: 1, carbs: 35, fat: 1 },
  'fruit': { calories: 90, protein: 1, carbs: 22, fat: 0 },
  // Snacks & nuts
  'almonds': { calories: 170, protein: 6, carbs: 6, fat: 15 },
  'cashews': { calories: 180, protein: 5, carbs: 10, fat: 14 },
  'nuts': { calories: 175, protein: 5, carbs: 8, fat: 15 },
  'biscuits': { calories: 140, protein: 2, carbs: 20, fat: 6 },
  // Drinks
  'juice': { calories: 120, protein: 1, carbs: 28, fat: 0 },
  'coffee': { calories: 20, protein: 1, carbs: 3, fat: 1 },
  'milk coffee': { calories: 90, protein: 5, carbs: 9, fat: 3 },
  // Common meals
  'sandwich': { calories: 380, protein: 18, carbs: 42, fat: 14 },
  'burger': { calories: 550, protein: 28, carbs: 42, fat: 28 },
  'pizza': { calories: 480, protein: 18, carbs: 56, fat: 18 },
  'soup': { calories: 180, protein: 8, carbs: 22, fat: 6 },
};

function smartEstimate(food) {
  const f = food.toLowerCase();
  let totalCal = 0, totalPro = 0, totalCarb = 0, totalFat = 0;
  let matches = 0;
  
  // Try multi-word matches first
  const sorted = Object.keys(NUTRITION_DB).sort((a, b) => b.length - a.length);
  const usedKeys = new Set();
  
  for (const key of sorted) {
    if (f.includes(key) && !usedKeys.has(key)) {
      // Avoid double counting (e.g. "chicken" if "grilled chicken" matched)
      const alreadyCovered = [...usedKeys].some(used => used.includes(key) || key.includes(used));
      if (!alreadyCovered) {
        const item = NUTRITION_DB[key];
        // Check for quantity multipliers
        const qMatch = f.match(/(\d+)\s*(pieces?|slices?|eggs?|cups?|tbsp|serving)?\s*(?:of\s+)?/ + key);
        const qty = qMatch ? Math.min(parseInt(qMatch[1]), 5) : 1;
        totalCal += item.calories * qty;
        totalPro += item.protein * qty;
        totalCarb += item.carbs * qty;
        totalFat += item.fat * qty;
        matches++;
        usedKeys.add(key);
      }
    }
  }
  
  if (matches === 0) {
    // Generic meal estimate based on meal type keywords
    if (f.includes('breakfast')) return { calories: 380, protein: 22, carbs: 38, fat: 14 };
    if (f.includes('lunch')) return { calories: 520, protein: 32, carbs: 48, fat: 18 };
    if (f.includes('dinner')) return { calories: 450, protein: 30, carbs: 35, fat: 18 };
    if (f.includes('snack')) return { calories: 180, protein: 8, carbs: 22, fat: 7 };
    return { calories: 400, protein: 20, carbs: 40, fat: 15 };
  }
  
  return {
    calories: Math.round(totalCal),
    protein: Math.round(totalPro),
    carbs: Math.round(totalCarb),
    fat: Math.round(totalFat)
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  let food = req.body.foodDescription || 'meal';
  const match = food.match(/The user ate: "([^"]+)"/);
  if (match) food = match[1];

  try {
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
    
    // AI quota exceeded — use smart offline estimate
    const est = smartEstimate(food);
    return res.status(200).json({ ...est, description: food });
    
  } catch (err) {
    const est = smartEstimate(food);
    return res.status(200).json({ ...est, description: food });
  }
}
