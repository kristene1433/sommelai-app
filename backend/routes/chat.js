// backend/routes/chat.js
const express = require('express');
const router = express.Router();

// Test endpoint to verify OpenAI API connectivity
router.get('/test', async (req, res) => {
  try {
    console.log('[chat] Testing OpenAI gpt-oss-20b connectivity...');
    const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY?.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.TEXT_MODEL || 'gpt-oss-20b',
        messages: [
          { role: 'user', content: 'Hello, how are you?' }
        ],
      }),
    });
    
    const data = await testResponse.json();
    console.log('[chat] Test response:', data);
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (testResponse.ok && text) {
      res.json({ success: true, message: 'OpenAI gpt-oss-20b OK', testResponse: text });
    } else {
      res.json({ success: false, message: 'OpenAI API test failed', error: data?.error || 'Unknown error' });
    }
  } catch (err) {
    console.error('[chat] Test error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Test failed',
      error: err.message 
    });
  }
});

// Text-based chat endpoint using OpenAI GPT-5 mini
router.post('/somm', async (req, res) => {
  try {
    const { messages, usePreferences, preferences } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Build system prompt with preferences if provided
    let systemPrompt = 'You are a master sommelier and friendly conversationalist. ' +
      'The conversation is about a specific wine identified earlier. ' +
      'For every follow-up question, answer as if referring to that wine unless the user explicitly changes topic. ';

    if (usePreferences && preferences) {
      systemPrompt += `\nUSER PREFERENCES:\n- Wine Types: ${preferences.wineTypes?.join(', ') || 'any'}\n- Flavor Profiles: ${preferences.flavorProfiles?.join(', ') || 'any'}\n`;
    } else {
      systemPrompt += '\nUSER PREFERENCES: None provided.\n';
    }

    systemPrompt += '\nInstructions:\n' +
      '- Always answer about the known wine unless told otherwise.\n' +
      '- Recommend 2–3 varietals when asked.\n' +
      '- Add Perfect Pairing section (no bullets, no numbers, no markdown—just conversational style).\n' +
      '- End with a question to keep chat going.\n' +
      '- Be knowledgeable, approachable, charming. No asterisks, no markdown, no numbered lists.';

    // Add system message at the beginning
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    console.log('[chat] Calling OpenAI gpt-oss-20b...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
    
    const ai = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY?.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.TEXT_MODEL || 'gpt-oss-20b',
        messages: fullMessages,
      }),
      signal: controller.signal,
    }).then(r => r.json());
    
    clearTimeout(timeoutId);

    if (!ai || ai.error) {
      console.error('[chat] OpenAI API Error:', ai);
      throw new Error(ai?.error?.message || 'No response from OpenAI');
    }

    // Extract text from chat completions format
    const answer = ai?.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not generate a response.';

    console.log('[chat] Final answer:', answer);
    res.json({ answer });
  } catch (err) {
    console.error('[chat] error:', err);
    if (err.name === 'AbortError') {
      res.status(408).json({ error: 'Request timeout - OpenAI took too long to respond' });
    } else {
    res.status(500).json({ error: err.stack || err.message || 'Chat error' });
    }
  }
});

module.exports = router;
