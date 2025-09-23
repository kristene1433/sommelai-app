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
    '80202': { city: 'Denver', region: 'CO', country: 'US' },
    '37201': { city: 'Nashville', region: 'TN', country: 'US' },
    '55401': { city: 'Minneapolis', region: 'MN', country: 'US' },
    '63101': { city: 'St. Louis', region: 'MO', country: 'US' },
    '70112': { city: 'New Orleans', region: 'LA', country: 'US' },
  };
  
  return zipToLocation[zip] || { city: 'Unknown', region: 'Unknown', country: 'US' };
};

// Helper to extract wine name from user query
const extractWineFromQuery = (query) => {
  // Remove common question words and extract wine-related terms
  const wineTerms = query
    .toLowerCase()
    .replace(/what's|what is|recommend|where can i find|where to buy|where to get/i, '')
    .replace(/a |an |the |do you |can you |please/i, '')
    .replace(/[?.,!]/g, '')
    .trim();
  
  // If it's still a question, try to extract wine name
  if (wineTerms.includes('raw producer') || wineTerms.includes('producer')) {
    return 'natural wine producers';
  }
  
  return wineTerms || 'wine';
};

router.post('/wineStores', async (req, res) => {
  const { query, zip } = req.body;
  if (!query || !zip) {
    return res.status(400).json({ message: 'query and zip required' });
  }

  try {
    const location = getLocationFromZip(zip);
    const wineName = extractWineFromQuery(query);
    const searchQuery = `wine stores selling "${wineName}" near ${location.city} ${location.region}`;
    
    console.log('🔍 Web searching for:', searchQuery);
    console.log('🔍 Original query:', query);
    console.log('🔍 Extracted wine:', wineName);
    console.log('🔍 Location:', location);
    
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
            content: 'You are a wine expert helping find specific wines for sale online. Search the web for actual wines available for purchase and return a JSON array of results. Format: [{"name":"Wine Name","price":"$XX.XX","store":"Store Name","address":"Store Address","url":"https://store.com/wine-link","description":"Brief wine description"}]'
          },
          {
            role: 'user',
            content: `Find specific wines for sale online: ${wineName}. Search for actual wines available for purchase with prices and direct purchase links. Include wine names, prices, store names, and direct URLs to buy the wine.`
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
        name: 'Wine Search Results',
        price: 'Call for price',
        store: 'See sources below',
        address: 'N/A',
        url: 'N/A',
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

    console.log('🔍 Found', results.length, 'wines with', sources.length, 'sources');
    
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
