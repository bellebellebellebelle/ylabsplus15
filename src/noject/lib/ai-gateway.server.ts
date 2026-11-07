// Lovable AI Gateway (OpenAI-compatible) helper
type Msg = {
  role: "system" | "user" | "assistant";
  content: string | Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
    | { type: "input_audio"; input_audio: { data: string; format: string } }
  >;
};

export async function callAI({
  model,
  messages,
  responseFormat,
}: {
  model: string;
  messages: Msg[];
  responseFormat?: "json_object";
}): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY manquant");

  const body: Record<string, unknown> = { model, messages };
  if (responseFormat === "json_object") {
    body.response_format = { type: "json_object" };
  }
  if (model.startsWith("openai/gpt-5.6")) {
    body.reasoning_effort = "none";
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    if (res.status === 429) throw new Error("Limite de requêtes IA atteinte, réessayez dans un instant.");
    if (res.status === 402) throw new Error("Crédits IA épuisés — ajoutez des crédits dans les paramètres.");
    throw new Error(`IA erreur ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = JSON.parse(text);
  return data.choices?.[0]?.message?.content ?? "";
}
