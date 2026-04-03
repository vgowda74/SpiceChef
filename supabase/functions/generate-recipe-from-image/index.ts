// Supabase Edge Function: generate-recipe-from-image
// Takes a food image (base64) and optional text, identifies the dish,
// and returns a structured recipe JSON.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a professional chef. You will receive an image of food — it could be a photo of a dish, a screenshot from social media, or a screenshot of a recipe description.

Your job:
1. Identify what the dish is
2. Generate a complete recipe for it

If you can clearly identify the dish, return a JSON object (no markdown, no code fences):
{
  "identified": true,
  "title": "Recipe Name",
  "base_serves": 4,
  "duration_mins": 30,
  "tags": ["Non-Veg", "Italian"],
  "ingredients": [
    { "name": "Ingredient name", "amount": 2, "unit": "tbsp", "category": "PRODUCE" }
  ],
  "steps": [
    {
      "order": 1,
      "title": "Short step title",
      "text": "Instructions with **bold** for key ingredients and quantities.",
      "timer_seconds": 300,
      "timer_label": "Timer name",
      "needed_ingredients": [
        { "name": "Ingredient name", "amount": 2, "unit": "tbsp" }
      ]
    }
  ]
}

If you CANNOT clearly identify the dish or the image is not food-related, return:
{
  "identified": false,
  "reason": "Brief explanation of why you couldn't identify it"
}

Rules:
- category must be one of: PRODUCE, DAIRY, PROTEIN, SPICES, PANTRY
- Only include timer_seconds and timer_label when a step has a meaningful timed action
- Use **bold** in step text for key ingredients, quantities, and temperatures
- tags should include dietary info (Vegetarian, Vegan, Non-Veg) and cuisine type
- needed_ingredients per step must match names from the ingredients list
- Ingredient amounts must be numeric (0.5 not "1/2")
- If the image has text describing the recipe, use that information to make the recipe more accurate
- Do NOT guess if the image is unclear, blurry, or not food — return identified: false
- Return ONLY the JSON object, nothing else`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image_base64, media_type, description } = await req.json();

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const content: any[] = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: media_type || 'image/jpeg',
          data: image_base64,
        },
      },
    ];

    // Add optional text description
    if (description) {
      content.push({
        type: 'text',
        text: `Additional context from the user: ${description}`,
      });
    } else {
      content.push({
        type: 'text',
        text: 'Identify this dish and generate a complete recipe.',
      });
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
        messages: [{ role: 'user', content }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(
        JSON.stringify({ error: `Recipe generation failed. Please try again.` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Could not analyze the image' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return new Response(
          JSON.stringify({ error: 'Could not generate a recipe from this image' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      parsed = JSON.parse(match[0]);
    }

    // Check if Claude could identify the dish
    if (parsed.identified === false) {
      return new Response(
        JSON.stringify({
          error: parsed.reason || 'Could not identify the dish in this image. Try a clearer photo of the food.',
          identified: false,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ recipe: parsed, identified: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
