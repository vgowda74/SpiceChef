// Supabase Edge Function: generate-recipe
// Takes a recipe description, sends it to Claude API, and returns structured recipe JSON.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a professional chef and recipe writer. When given a recipe description, return a single JSON object (no markdown, no code fences) with this exact shape:
{
  "title": "Recipe Name",
  "base_serves": 4,
  "duration_mins": 30,
  "tags": ["Vegetarian", "Italian"],
  "ingredients": [
    { "name": "Ingredient name", "amount": 2, "unit": "tbsp", "category": "PRODUCE" }
  ],
  "steps": [
    { "order": 1, "title": "Step title", "text": "Step instructions with **bold** for key ingredients and quantities.", "timer_seconds": 300, "timer_label": "Timer name" }
  ]
}

Rules:
- category must be one of: PRODUCE, DAIRY, PROTEIN, SPICES, PANTRY
- Only include timer_seconds and timer_label when a step has a meaningful timed action
- Use **bold** in step text to highlight key ingredients and quantities
- tags should include dietary info (Vegetarian, Vegan, Non-Veg) and cuisine/style
- Aim for 5-8 ingredients and 4-6 steps
- Return ONLY the JSON object, nothing else`;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { description } = await req.json();

    if (!description || typeof description !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid description' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Anthropic API key is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: description }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(
        JSON.stringify({ error: `Claude API error: ${err}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'No response from Claude' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Parse JSON from Claude's response
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return new Response(
          JSON.stringify({ error: 'Could not parse recipe from response' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      parsed = JSON.parse(match[0]);
    }

    return new Response(
      JSON.stringify({ recipe: parsed }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
