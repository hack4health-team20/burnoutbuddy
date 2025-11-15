import { NextRequest } from 'next/server';
import { MoodValue } from '@/types';

export const dynamic = 'force-dynamic'; // Ensures requests aren't cached

// Simple in-memory cache to avoid repeated API calls for similar inputs
// Note: In production, use Redis or other persistent cache
const cache = new Map();

// Enhanced mood analysis based on keywords, sentiment context, and medical-specific language
function analyzeMoodLocally(text: string) {
  const lowerText = text.toLowerCase();
  let detectedMood: string = 'stressed'; // Default mood
  let confidence: number = 0.5;
  const analysisNotes: string[] = [];

  // Check for exhaustion indicators
  const exhaustedKeywords = ['tired', 'exhausted', 'drained', 'burned out', 'worn out', 'depleted', 'sapped', 'fatigued', 'sleepy', 'drowsy', 'gassed', 'pooped', 'beat', 'washed up', 'dead on my feet'];
  const exhaustedMatches = exhaustedKeywords.filter(keyword => lowerText.includes(keyword));
  
  // Check for stress indicators  
  const stressedKeywords = ['stressed', 'overwhelmed', 'pressure', 'anxious', 'worried', 'panic', 'tense', 'frustrated', 'irritated', 'agitated', 'antsy', 'uptight', 'keyed up', 'worked up'];
  const stressedMatches = stressedKeywords.filter(keyword => lowerText.includes(keyword));
  
  // Check for okay indicators
  const okKeywords = ['okay', 'fine', 'alright', 'manageable', 'not bad', 'surviving', 'hanging in there', 'chugging along', 'muddling through', 'coping', 'holding up', 'getting by'];
  const okMatches = okKeywords.filter(keyword => lowerText.includes(keyword));
  
  // Check for calm indicators
  const calmKeywords = ['calm', 'peaceful', 'relaxed', 'content', 'serene', 'centered', 'balanced', 'at peace', 'mellow', 'easygoing', 'chill', 'laid back'];
  const calmMatches = calmKeywords.filter(keyword => lowerText.includes(keyword));

  // Check for medical/work-specific context (which often indicates stress/exhaustion)
  const medicalWorkKeywords = ['shift', 'patients', 'rounds', 'charting', 'consult', 'code', 'crisis', 'emergency', 'surgery', 'procedure', 'meeting', 'conference', 'admin', 'paperwork'];
  const medicalWorkMatches = medicalWorkKeywords.filter(keyword => lowerText.includes(keyword));

  // Contextual sentiment indicators (phrases that indicate emotional state)
  const exhaustedContexts = [
    'so tired', 'too tired', 'really drained', 'completely done', 'totally exhausted', 
    'can barely keep', 'struggling to stay awake', 'running on empty', 'need to sleep'
  ];
  const stressedContexts = [
    'can\'t handle', 'too much', 'way too much', 'don\'t know how to handle', 'feeling behind', 
    'falling behind', 'falling apart', 'breaking down', 'at my limit', 'reached my limit'
  ];
  const okContexts = [
    'hanging in', 'doing ok', 'making it', 'getting through', 'not terrible', 'surprisingly well'
  ];
  const calmContexts = [
    'feeling centered', 'feeling balanced', 'at ease', 'feeling good', 'actually good', 'pretty good'
  ];

  // Check for contextual phrases
  const exhaustedContextMatches = exhaustedContexts.filter(context => lowerText.includes(context));
  const stressedContextMatches = stressedContexts.filter(context => lowerText.includes(context));
  const okContextMatches = okContexts.filter(context => lowerText.includes(context));
  const calmContextMatches = calmContexts.filter(context => lowerText.includes(context));

  // Calculate mood based on various indicators
  const exhaustedScore = exhaustedMatches.length * 2 + exhaustedContextMatches.length * 3;
  const stressedScore = stressedMatches.length * 2 + stressedContextMatches.length * 3;
  const okScore = okMatches.length * 2 + okContextMatches.length * 3;
  const calmScore = calmMatches.length * 2 + calmContextMatches.length * 3;

  // Determine mood based on highest score
  const scores = [
    { mood: 'exhausted', score: exhaustedScore },
    { mood: 'stressed', score: stressedScore },
    { mood: 'ok', score: okScore },
    { mood: 'calm', score: calmScore }
  ];

  // Sort by score to find highest
  scores.sort((a, b) => b.score - a.score);
  const highest = scores[0];

  if (highest.score > 0) {
    detectedMood = highest.mood;
    confidence = 0.5 + (highest.score * 0.1); // Higher confidence with higher scores
  } else {
    // If no clear indicators, use medical context to infer stress
    if (medicalWorkMatches.length > 0) {
      detectedMood = 'stressed';
      confidence = 0.6;
      analysisNotes.push(`medical work context`);
    } else {
      // Default to stressed for healthcare professionals if no other indicators
      detectedMood = 'ok';
      confidence = 0.4; // Lower confidence for default
      analysisNotes.push(`no clear indicators`);
    }
  }

  // Cap confidence at 0.95
  confidence = Math.min(0.95, confidence);

  // Generate a reason based on the analysis
  let reason: string;
  if (exhaustedMatches.length > 0) {
    reason = `I noticed you mentioned feeling "${exhaustedMatches[0]}", which suggests you might be experiencing exhaustion. `;
  } else if (stressedMatches.length > 0) {
    reason = `I noticed you mentioned feeling "${stressedMatches[0]}", which suggests you might be experiencing stress. `;
  } else if (calmMatches.length > 0) {
    reason = `I noticed you mentioned feeling "${calmMatches[0]}", which suggests you might be experiencing calmness. `;
  } else if (okMatches.length > 0) {
    reason = `I noticed you mentioned feeling "${okMatches[0]}", which suggests you might be feeling okay. `;
  } else if (exhaustedContextMatches.length > 0) {
    reason = `Based on "${exhaustedContextMatches[0]}", you seem to be experiencing exhaustion. `;
  } else if (stressedContextMatches.length > 0) {
    reason = `Based on "${stressedContextMatches[0]}", you seem to be experiencing stress. `;
  } else if (medicalWorkMatches.length > 0) {
    reason = `I sense work-related stress from your mention of "${medicalWorkMatches[0]}". `;
  } else {
    reason = `Based on the sentiment in your description, you seem to be feeling ${detectedMood}. `;
  }
  
  reason += `Would you like me to select "${detectedMood}" as your current mood?`;

  return {
    detectedMood,
    confidence,
    reason
  };
}

// Helper function to create a simple hash of the input
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

export async function POST(request: NextRequest) {
  const { text } = await request.json();

  if (!text) {
    return Response.json({ error: 'Text is required' }, { status: 400 });
  }

  // Validate and limit input length to control costs
  if (typeof text !== 'string' || text.length > 500) {
    return Response.json({ error: 'Text must be a string under 500 characters' }, { status: 400 });
  }

  // Create a cache key based on the input text
  const cacheKey = simpleHash(text.toLowerCase().trim());
  
  // Check cache first
  if (cache.has(cacheKey)) {
    return Response.json(cache.get(cacheKey));
  }

  if (!process.env.OPENAI_API_KEY) {
    // Perform simple keyword-based analysis when API key is missing
    const result = analyzeMoodLocally(text);
    
    // Cache the result
    cache.set(cacheKey, result);
    
    // Optional: Clear cache entries older than 10 minutes to prevent memory issues
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return Response.json(result);
  }

  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: "system",
            content: `You are an expert emotional wellness analyst for healthcare professionals. Analyze the following description and identify their current mood state. You must choose exactly one mood from ONLY these four options: "calm", "ok", "stressed", or "exhausted". 

Provide:
- mood: (string, one of the 4 options above)
- confidence: (number between 0 and 1)
- reason: (string explaining your analysis)

Respond ONLY in JSON format with no other text.`
          },
          {
            role: "user",
            content: `Analyze this healthcare professional's description: "${text}".`
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 150, // Reduced from 200 to further control costs
        response_format: { type: "json_object" } // JSON response format to improve parsing
      }),
    });

    if (!openaiResponse.ok) {
      // Perform local analysis when OpenAI API call fails
      const result = analyzeMoodLocally(text);
      
      // Cache the result
      cache.set(cacheKey, result);
      
      // Optional: Clear cache entries older than 10 minutes to prevent memory issues
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      return Response.json(result);
    }

    const data = await openaiResponse.json();
    const content = data.choices[0].message.content;

    // Parse the JSON response (should be more reliable with response_format)
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(content);
    } catch (parseError) {
      console.warn("Failed to parse OpenAI mood response", parseError);
      // Perform local analysis when JSON parsing fails
      const result = analyzeMoodLocally(text);
      
      // Cache the result
      cache.set(cacheKey, result);
      
      // Optional: Clear cache entries older than 10 minutes to prevent memory issues  
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      return Response.json(result);
    }

    // Validate the response has the required fields
    if (!parsedResponse.mood || !parsedResponse.confidence || !parsedResponse.reason) {
      // Perform local analysis when response format is invalid
      const result = analyzeMoodLocally(text);
      
      // Cache the result
      cache.set(cacheKey, result);
      
      // Optional: Clear cache entries older than 10 minutes to prevent memory issues
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      return Response.json(result);
    }

    // Ensure mood is one of our defined values
    const validMoods: MoodValue[] = ['calm', 'ok', 'stressed', 'exhausted'];
    const detectedMood = validMoods.includes(parsedResponse.mood) 
      ? parsedResponse.mood 
      : 'stressed';

    const result = { 
      detectedMood,
      confidence: parsedResponse.confidence,
      reason: parsedResponse.reason
    };

    // Cache the result (for a short time to avoid stale data)
    cache.set(cacheKey, result);
    
    // Optional: Clear cache entries older than 10 minutes to prevent memory issues
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return Response.json(result);
  } catch (error) {
    console.error('Error analyzing mood with OpenAI:', error);
    // Perform local analysis when unexpected error occurs
    const result = analyzeMoodLocally(text);
    
    // Cache the result
    cache.set(cacheKey, result);
    
    // Optional: Clear cache entries older than 10 minutes to prevent memory issues
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return Response.json(result);
  }
}