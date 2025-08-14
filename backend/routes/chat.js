// backend/routes/chat.js
const express = require('express');
const router = express.Router();

// Test endpoint to verify OpenAI API connectivity
router.get('/test', async (req, res) => {
  try {
    console.log('[chat] Testing OpenAI GPT-5 mini connectivity...');
    const testResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY?.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        input: [
          {
            role: 'user',
            content: 'Hello, how are you?'
          }
        ],
      }),
    });
    
    const data = await testResponse.json();
    console.log('[chat] Test response:', data);
    
    if (testResponse.ok && data && data.output_text) {
      res.json({ 
        success: true, 
        message: 'OpenAI GPT-5 mini is working!',
        testResponse: data.output_text 
      });
    } else {
      res.json({ 
        success: false, 
        message: 'OpenAI API test failed',
        error: data.error || 'Unknown error'
      });
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

    console.log('[chat] Calling OpenAI GPT-5 mini...');
    const ai = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY?.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        input: fullMessages,
      }),
    }).then(r => r.json());

    if (!ai || ai.error) {
      console.error('[chat] OpenAI API Error:', ai);
      throw new Error(ai?.error?.message || 'No response from OpenAI');
    }

    const answer = ai.output_text?.trim() || 'Sorry, I could not generate a response.';

    res.json({ answer });
  } catch (err) {
    console.error('[chat] error:', err);
    res.status(500).json({ error: err.stack || err.message || 'Chat error' });
  }
});

module.exports = router;
