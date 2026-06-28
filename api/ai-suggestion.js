module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, description, subject } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Missing title or description' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const prompt = `You are a helpful study assistant for college students. A student posted this question in a peer-learning app${subject ? ` (subject: ${subject})` : ''}:

Title: ${title}
Description: ${description}

Give a clear, concise, helpful draft answer in 3-5 sentences. Be direct and educational. Do not say "I am an AI" or add disclaimers - just answer the question helpfully. If the question is too vague or you genuinely cannot help, say so briefly.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return res.status(geminiResponse.status).json({ error: data.error?.message || 'Gemini API error' });
    }

    const parts = data.candidates?.[0]?.content?.parts || [];
    const answer = parts.map(p => p.text || '').join('').trim();

    if (!answer) {
      return res.status(500).json({ error: 'No response generated' });
    }

    return res.status(200).json({ answer });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
