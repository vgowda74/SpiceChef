// Supabase Edge Function: parse-cookbook
// Reads a PDF from Supabase Storage, sends it to Claude API for recipe extraction,
// saves the parsed cookbook + recipes to the database, and returns the results.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_RECIPES_PER_COOKBOOK = 50;

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
    needed_ingredients?: { name: string; amount: number; unit: string }[];
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

const CLAUDE_PARSE_PROMPT = `You are a cookbook parser. Analyze this PDF and extract up to 10 of the best recipes. Keep descriptions concise.

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
          "needed_ingredients": [
            { "name": "Ingredient name", "amount": 2, "unit": "tbsp" }
          ]
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
- "needed_ingredients" must be objects with name, amount, unit — matching the top-level ingredients
- "tags" should include cuisine type, dietary info (Vegetarian, Vegan, Non-Veg), key ingredients
- "duration_mins" is the total estimated cooking time
- Each step "title" should be a concise action phrase like "Sauté the aromatics"
- In step "text", wrap key ingredients and times in **bold** markdown
- Extract up to 10 best recipes, keep step text brief
- If author or title isn't clear from the PDF, make your best guess from context
- If the PDF doesn't contain recipes, return: {"title":"","author":"","recipes":[]}

Return ONLY valid JSON, no markdown fences, no explanation.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { file_path, user_id } = await req.json();

    if (!file_path) {
      return new Response(
        JSON.stringify({ error: 'Missing file path. Please select a PDF to upload.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'Recipe parsing service is temporarily unavailable. Please try again later.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Download PDF from Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('cookbooks')
      .download(file_path);

    if (downloadError || !fileData) {
      return new Response(
        JSON.stringify({ error: 'Could not read your PDF file. It may have been removed or is corrupted. Please try uploading again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validate file size
    const arrayBuffer = await fileData.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_PDF_SIZE_BYTES) {
      return new Response(
        JSON.stringify({ error: `This PDF is too large (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)} MB). Maximum size is ${MAX_PDF_SIZE_BYTES / 1024 / 1024} MB. Try a shorter cookbook or split it into sections.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Validate it looks like a PDF
    const header = new Uint8Array(arrayBuffer.slice(0, 5));
    const pdfHeader = String.fromCharCode(...header);
    if (!pdfHeader.startsWith('%PDF')) {
      return new Response(
        JSON.stringify({ error: 'This file is not a valid PDF. Please upload a PDF cookbook.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Convert to base64
    const base64Pdf = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // 5. Send to Claude API for parsing
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
      // Parse Claude error for user-friendly message
      if (errText.includes('credit balance') || errText.includes('usage limits')) {
        return new Response(
          JSON.stringify({ error: 'Our recipe parsing service is at capacity right now. Please try again in a few minutes.' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Failed to analyze your cookbook. Please try again.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const claudeResult = await claudeResponse.json();
    const rawText = claudeResult.content?.[0]?.text ?? '';

    // 6. Parse Claude's JSON response
    let parsed: ParsedCookbook;
    try {
      const jsonStr = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      // Try extracting JSON from within the response
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          return new Response(
            JSON.stringify({ error: 'Could not extract recipes from this PDF. It may not contain recognizable recipes, or the format is not supported.', debug: rawText.substring(0, 200) }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: 'Could not extract recipes from this PDF. It may not contain recognizable recipes, or the format is not supported.', debug: rawText.substring(0, 200) }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 7. Validate parsed content
    if (!parsed.recipes || parsed.recipes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'This doesn\'t appear to be a cookbook. We couldn\'t find any recipes with ingredients and cooking instructions. Please upload a PDF that contains recipes.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit recipes
    if (parsed.recipes.length > MAX_RECIPES_PER_COOKBOOK) {
      parsed.recipes = parsed.recipes.slice(0, MAX_RECIPES_PER_COOKBOOK);
    }

    // Validate each recipe has minimum required data
    parsed.recipes = parsed.recipes.filter((r) =>
      r.title && r.ingredients && r.ingredients.length > 0 && r.steps && r.steps.length > 0
    );

    if (parsed.recipes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'The recipes in this PDF could not be properly parsed. They may be in a format we don\'t support yet (e.g. images only, no text).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Save cookbook to database
    const { data: cookbookRow, error: cbError } = await supabaseAdmin
      .from('cookbooks')
      .insert({
        user_id: user_id || null,
        title: parsed.title || 'Untitled Cookbook',
        author: parsed.author || 'Unknown',
        file_url: file_path,
        recipe_count: parsed.recipes.length,
      })
      .select()
      .single();

    if (cbError || !cookbookRow) {
      return new Response(
        JSON.stringify({ error: 'Could not save the cookbook. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. Save recipes to database
    const recipesToInsert = parsed.recipes.map((r) => ({
      cookbook_id: cookbookRow.id,
      user_id: user_id || null,
      title: r.title,
      ingredients: r.ingredients,
      steps: r.steps,
      base_serves: r.base_serves || 4,
      tags: r.tags || [],
      duration_mins: r.duration_mins || 0,
    }));

    const { data: recipeRows, error: recipeError } = await supabaseAdmin
      .from('recipes')
      .insert(recipesToInsert)
      .select();

    if (recipeError) {
      // Clean up cookbook if recipes fail
      await supabaseAdmin.from('cookbooks').delete().eq('id', cookbookRow.id);
      return new Response(
        JSON.stringify({ error: 'Could not save the recipes. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 10. Return success
    return new Response(
      JSON.stringify({
        cookbook: cookbookRow,
        recipes: recipeRows,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Something went wrong processing your cookbook. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
