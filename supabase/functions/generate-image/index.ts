// Supabase Edge Function: generate-image
// Generates a food photo using fal.ai and uploads to Supabase Storage.
// Returns the public URL of the image.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { id, title, type } = await req.json();

    if (!id || !title) {
      return new Response(
        JSON.stringify({ error: 'Missing id or title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const falKey = Deno.env.get('FAL_KEY');
    if (!falKey) {
      return new Response(
        JSON.stringify({ error: 'FAL_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const imageType = type || 'recipe';
    const prompt = imageType === 'cookbook'
      ? `Premium cookbook cover design, elegant food magazine style, '${title}' cookbook, stunning hero dish photograph, dramatic moody lighting, dark elegant background, gold accents, cinematic composition, professional food styling, portrait orientation, 4k quality`
      : `${title} served in a ceramic bowl on a dark wooden table, natural soft lighting, realistic food photo, not styled, authentic home cooking, warm tones, slightly imperfect plating, shot with a 50mm lens`;

    // Generate image via fal.ai
    const falResponse = await fetch('https://fal.run/fal-ai/flux-1/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, image_size: 'portrait_4_3', num_images: 1 }),
    });

    if (!falResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Image generation failed' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const falData = await falResponse.json();
    const imageUrl = falData?.images?.[0]?.url;
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'No image returned' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Download image
    const imgResponse = await fetch(imageUrl);
    const imgBlob = await imgResponse.blob();
    const imgArray = new Uint8Array(await imgBlob.arrayBuffer());

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const folder = imageType === 'cookbook' ? 'cookbooks' : 'recipes';
    const storagePath = `images/${folder}/${id}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(storagePath, imgArray, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: `Upload failed: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { data: urlData } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(storagePath);

    return new Response(
      JSON.stringify({ image_url: urlData.publicUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
