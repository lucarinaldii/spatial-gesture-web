import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { command, grabbedCardIds } = await req.json();
    console.log('Interpreting voice command:', command, 'Grabbed cards:', grabbedCardIds);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a voice command interpreter for a spatial UI canvas application. 
Users can manipulate cards on a canvas using voice commands. 

Available actions:
- add_card: Create a new card on the canvas
- delete_card: Delete currently grabbed card(s)
- clear_all: Remove all cards from canvas

Context:
- User currently has ${grabbedCardIds?.length || 0} card(s) grabbed

Analyze the user's voice command and determine the intended action.
Return ONLY the action name, nothing else.

Examples:
"add a new card" -> add_card
"create card" -> add_card
"aggiungi una card" -> add_card
"delete this card" -> delete_card
"remove card" -> delete_card
"elimina la card" -> delete_card
"clear everything" -> clear_all
"delete all cards" -> clear_all`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: command }
        ],
        temperature: 0.3,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "rate_limit", message: "Too many requests. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "payment_required", message: "AI credits depleted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const action = data.choices[0]?.message?.content?.trim().toLowerCase();

    console.log('Interpreted action:', action);

    // Validate action
    const validActions = ['add_card', 'delete_card', 'clear_all'];
    const interpretedAction = validActions.includes(action) ? action : null;

    return new Response(
      JSON.stringify({ 
        action: interpretedAction,
        originalCommand: command 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in interpret-voice-command:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        action: null 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
