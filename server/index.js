require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const data = require('./data.json');

const app = express();
app.use(cors());
app.use(express.json());

// --- HOT-SWAP: POINTING OPENAI SDK TO GROQ ---
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

const NLP_URL = process.env.NLP_SERVICE_URL;

app.get('/api/customers', (req, res) => {
  res.json(data);
});

app.get('/api/customers/:id/matches', async (req, res) => {
  const user = data.find(c => c.id === parseInt(req.params.id));
  if (!user) return res.status(404).send('User not found');

  let pool = data.filter(profile => profile.gender !== user.gender);
  let nlpScores = [];

  try {
    const matchDesignations = pool.map(m => m.designation);
    const nlpResponse = await fetch(`${NLP_URL}/api/batch-similarity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_text: user.designation,
        match_texts: matchDesignations
      })
    });

    if (!nlpResponse.ok) throw new Error("Python server returned an error");
    const nlpData = await nlpResponse.json();
    nlpScores = nlpData.scores || []; 
    
  } catch (error) {
    console.warn("⚠️ NLP Engine offline or failed. Falling back to basic math scoring.");
    nlpScores = Array(pool.length).fill(0); 
  }

  let scoredMatches = pool.map((match, index) => {
    let totalScore = 0;

    if (user.gender === 'Male') {
      if (match.age < user.age) totalScore += 30;
      if (match.height < user.height) totalScore += 20;
      if (match.wantKids === user.wantKids) totalScore += 20;
    } else if (user.gender === 'Female') {
      if (match.religion === user.religion) totalScore += 40;
      if (match.openToRelocate === user.openToRelocate) totalScore += 30;
    }

    const careerAlignmentScore = (nlpScores[index] || 0) * 0.30;
    totalScore += careerAlignmentScore;

    return { ...match, matchScore: Math.round(totalScore) };
  });

  scoredMatches.sort((a, b) => b.matchScore - a.matchScore);
  res.json(scoredMatches.slice(0, 5));
});

// --- AREA: AI EMAIL GENERATOR (POWERED BY GROQ) ---
app.post('/api/generate-intro', async (req, res) => {
  const { client, match } = req.body;

  const prompt = `
    You are an expert matchmaker for The Date Crew.
    Client: ${client.firstName}, ${client.age} years old, works as ${client.designation}.
    Match: ${match.firstName}, ${match.age} years old, works as ${match.designation}.

    Write a 1-sentence explanation of why they are a good match based on their profiles.
    Then, write a short, warm, 3-sentence email to the Client introducing the Match. 
    Separate the explanation and the email with a "|".
  `;

  try {
    const aiResponse = await openai.chat.completions.create({
      // Swapped to the current, active Groq Llama 3.1 model
      model: "llama-3.1-8b-instant", 
      messages: [{ role: "user", content: prompt }],
    });

    const result = aiResponse.choices[0].message.content.split("|");
    res.json({ explanation: result[0].trim(), emailDraft: result[1].trim() });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).send("AI error");
  }
});

app.listen(5000, () => {
  console.log("Node Server running on port 5000");
});