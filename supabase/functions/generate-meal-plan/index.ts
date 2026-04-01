// Supabase Edge Function: generate-meal-plan
// Takes meal plan preferences and returns a 7-day plan with grocery list.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a professional meal planner and chef. Given the user's preferences, create a 7-day meal plan. Return a single JSON object (no markdown, no code fences) with this exact shape:
{
  "plan": [
    {
      "day": "Monday",
      "meals": [
        {
          "mealType": "breakfast",
          "title": "Recipe Name",
          "description": "1-2 sentence description of the dish",
          "duration_mins": 15
        }
      ]
    }
  ],
  "grocery_list": [
    { "name": "Chicken breast", "amount": "1.5 kg", "category": "PROTEIN" }
  ]
}

Rules:
- Include meals ONLY for the meal types the user selected
- If planMode is "same", use the same meals every day (but vary within a day). If "varied", different meals each day.
- category must be one of: PRODUCE, DAIRY, PROTEIN, SPICES, PANTRY, DRINKS
- grocery_list should be aggregated across all 7 days — combine duplicate ingredients and sum quantities
- If the user listed ingredients they already have, EXCLUDE those from the grocery_list
- Respect all dietary restrictions strictly
- For drinks: suggest specific recipes (e.g. "Masala Chai" not just "Tea")
- Make meals practical — consider prep time, variety of cuisines, and seasonal ingredients
- Ensure nutritional balance across the day (protein + carbs + vegetables)
- Scale all quantities for the specified serving size
- Return ONLY the JSON object, nothing else`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      dietaryRestrictions,
      availableIngredients,
      mealTypes,
      drinkTypes,
      planMode,
      servingSize,
    } = await req.json();

    if (!mealTypes || !Array.isArray(mealTypes) || mealTypes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one meal type is required' }),
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

    // Build user prompt from preferences
    const parts: string[] = [];
    parts.push(`Create a 7-day meal plan for ${servingSize} people.`);
    parts.push(`Meal types needed: ${mealTypes.join(', ')}.`);

    if (drinkTypes && drinkTypes.length > 0) {
      parts.push(`Drink preferences: ${drinkTypes.join(', ')}.`);
    }

    if (dietaryRestrictions && dietaryRestrictions.length > 0) {
      parts.push(`Dietary restrictions: ${dietaryRestrictions.join(', ')}.`);
    }

    if (availableIngredients && availableIngredients.length > 0) {
      parts.push(`Ingredients I already have (exclude from grocery list): ${availableIngredients.join(', ')}.`);
    }

    parts.push(`Plan mode: ${planMode === 'same' ? 'Same meals every day' : 'Different meals each day'}.`);

    const userPrompt = parts.join('\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
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

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return new Response(
          JSON.stringify({ error: 'Could not parse meal plan from response' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      parsed = JSON.parse(match[0]);
    }

    return new Response(
      JSON.stringify({ mealPlan: parsed }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
