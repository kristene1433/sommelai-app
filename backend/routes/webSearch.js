// routes/webSearch.js - Real web search for wine stores
const express = require('express');
const router = express.Router();
require('dotenv').config();

// Helper to map ZIP to city/region for location-aware search
const getLocationFromZip = (zip) => {
  // Basic mapping - you could use a proper ZIP database
  const zipToLocation = {
    '10001': { city: 'New York', region: 'NY', country: 'US' },
    '90210': { city: 'Beverly Hills', region: 'CA', country: 'US' },
    '94102': { city: 'San Francisco', region: 'CA', country: 'US' },
    '60601': { city: 'Chicago', region: 'IL', country: 'US' },
    '33101': { city: 'Miami', region: 'FL', country: 'US' },
    '75201': { city: 'Dallas', region: 'TX', country: 'US' },
    '98101': { city: 'Seattle', region: 'WA', country: 'US' },
    '02101': { city: 'Boston', region: 'MA', country: 'US' },
    '30301': { city: 'Atlanta', region: 'GA', country: 'US' },
    '85001': { city: 'Phoenix', region: 'AZ', country: 'US' },
  };
  
  return zipToLocation[zip] || { city: 'Unknown', region: 'Unknown', country: 'US' };
};

router.post('/wineStores', async (req, res) => {
  const { query, zip } = req.body;
  if (!query || !zip) {
    return res.status(400).json({ message: 'query and zip required' });
  }

  try {
    const location = getLocationFromZip(zip);
    const searchQuery = `wine stores selling "${query}" near ${location.city} ${location.region}`;
    
    console.log('🔍 Web searching for:', searchQuery);
    
    const ai = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY?.trim()}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-search-preview',
        web_search_options: {
          user_location: {
            type: 'approximate',
            approximate: {
              country: location.country,
              city: location.city,
              region: location.region,
            },
          },
        },
        messages: [
          {
            role: 'system',
            content: 'You are a wine expert helping find real local wine stores. Search the web for actual wine stores and return a JSON array of results. Format: [{"name":"Store Name","address":"Full Address","phone":"Phone Number","website":"https://website.com","description":"Brief description"}]'
          },
          {
            role: 'user',
            content: `Find real wine stores near ${location.city}, ${location.region} that sell ${query}. Include store names, addresses, phone numbers, and websites.`
          }
        ],
      }),
    });

    const response = await ai.json();
    
    if (!ai.ok) {
      console.error('Web search API error:', response);
      return res.status(500).json({ message: 'Web search failed' });
    }

    // Extract the response content and citations
    const content = response.choices?.[0]?.message?.content || '';
    const annotations = response.choices?.[0]?.message?.annotations || [];
    
    // Try to parse JSON from the response
    let results = [];
    try {
      // Look for JSON array in the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.log('Could not parse JSON, using fallback');
      // Fallback: create a simple result from the text
      results = [{
        name: 'Search Results',
        address: 'See sources below',
        phone: 'N/A',
        website: 'N/A',
        description: content.substring(0, 200) + '...'
      }];
    }

    // Extract sources from annotations
    const sources = annotations
      .filter(ann => ann.type === 'url_citation')
      .map(ann => ({
        title: ann.url_citation?.title || 'Source',
        url: ann.url_citation?.url || '',
        startIndex: ann.url_citation?.start_index || 0,
        endIndex: ann.url_citation?.end_index || 0
      }));

    console.log('🔍 Found', results.length, 'stores with', sources.length, 'sources');
    
    return res.json({ 
      results, 
      sources,
      searchQuery,
      location: `${location.city}, ${location.region}`
    });
    
  } catch (err) {
    console.error('webSearch error:', err);
    return res.status(500).json({ message: 'Web search failed' });
  }
});

module.exports = router;
