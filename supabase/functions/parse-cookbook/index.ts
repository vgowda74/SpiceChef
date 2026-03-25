// Supabase Edge Function: parse-cookbook
// Reads a PDF from Supabase Storage, sends it to Claude API for recipe extraction,
// saves the parsed cookbook + recipes to the database, and returns the results.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedRecipe {
  title: string;
  ingredients: {
    name: string;
    amount: number;
    unit: string;
    category: string;
  }[];
  steps: {
    order: number;
    title: string;
    text: string;
    timer_seconds?: number;
    timer_label?: string;
    needed_ingredients?: string[];
  }[];
  base_serves: number;
  tags: string[];
  duration_mins: number;
}

interface ParsedCookbook {
  title: string;
  author: string;
  recipes: ParsedRecipe[];
}

const CLAUDE_PARSE_PROMPT = `You are a cookbook parser. Analyze this PDF and extract ALL recipes you can find.

Return a JSON object with this exact structure:
{
  "title": "Cookbook title",
  "author": "Author name",
  "recipes": [
    {
      "title": "Recipe name",
      "ingredients": [
        { "name": "Ingredient name", "amount": 2, "unit": "tbsp", "category": "PRODUCE" }
      ],
      "steps": [
        {
          "order": 1,
          "title": "Short step title (3-5 words)",
          "text": "Detailed instruction text. Use **bold** for key ingredients and times.",
          "timer_seconds": 480,
          "timer_label": "Description of what the timer is for",
          "needed_ingredients": ["2 tbsp oil", "1 onion, diced"]
        }
      ],
      "base_serves": 4,
      "tags": ["Vegetarian", "Quick", "Italian"],
      "duration_mins": 35
    }
  ]
}

Rules:
- "category" must be one of: PRODUCE, PROTEIN, DAIRY, SPICES, PANTRY, OTHER
- "amount" must be a number (use 0 if not specified, convert fractions: ½=0.5, ¼=0.25)
- "timer_seconds" only when the step has a specific wait/cook time
- "needed_ingredients" lists the specific ingredients + amounts needed for that step
- "tags" should include cuisine type, dietary info (Vegetarian, Vegan), key ingredients, difficulty
- "duration_mins" is the total estimated cooking time
- Each step "title" should be a concise action phrase like "Sauté the aromatics"
- In step "text", wrap key ingredients and times in **bold** markdown
- Extract every recipe you can find in the PDF
- If author or title isn't clear from the PDF, make your best guess from context

Return ONLY valid JSON, no markdown fences, no explanation.`;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { file_path, user_id } = await req.json();

    if (!file_path) {
      return new Response(
        JSON.stringify({ error: 'file_path is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Download PDF from Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('cookbooks')
      .download(file_path);

    if (downloadError || !fileData) {
      return new Response(
        JSON.stringify({ error: 'Failed to download PDF', details: downloadError?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert PDF to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Pdf = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // Send to Claude API for parsing
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64Pdf,
                },
              },
              {
                type: 'text',
                text: CLAUDE_PARSE_PROMPT,
              },
            ],
          },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      return new Response(
        JSON.stringify({ error: 'Claude API error', details: errText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const claudeResult = await claudeResponse.json();
    const rawText = claudeResult.content?.[0]?.text ?? '';

    // Parse Claude's JSON response
    let parsed: ParsedCookbook;
    try {
      // Strip markdown fences if present
      const jsonStr = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Failed to parse Claude response as JSON', raw: rawText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save cookbook to database
    const { data: cookbookRow, error: cbError } = await supabaseAdmin
      .from('cookbooks')
      .insert({
        user_id: user_id || null,
        title: parsed.title,
        author: parsed.author,
        file_url: file_path,
        recipe_count: parsed.recipes.length,
      })
      .select()
      .single();

    if (cbError || !cookbookRow) {
      return new Response(
        JSON.stringify({ error: 'Failed to save cookbook', details: cbError?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save recipes to database
    const recipesToInsert = parsed.recipes.map((r) => ({
      cookbook_id: cookbookRow.id,
      user_id: user_id || null,
      title: r.title,
      ingredients: r.ingredients,
      steps: r.steps,
      base_serves: r.base_serves,
      tags: r.tags,
      duration_mins: r.duration_mins,
    }));

    const { data: recipeRows, error: recipeError } = await supabaseAdmin
      .from('recipes')
      .insert(recipesToInsert)
      .select();

    if (recipeError) {
      return new Response(
        JSON.stringify({ error: 'Failed to save recipes', details: recipeError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return the full result
    return new Response(
      JSON.stringify({
        cookbook: cookbookRow,
        recipes: recipeRows,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
