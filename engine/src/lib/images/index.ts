// Image generation, behind the same adapter pattern as the LLM. Dark until a key
// exists: without OPENAI_API_KEY the UI shows the configError and hides nothing else.

export interface ImageProvider {
  readonly name: string;
  configError(): string | null;
  generate(opts: { prompt: string; size?: "1024x1024" | "1536x1024" | "1024x1536" }): Promise<{ data: Buffer; mime: string }>;
}

// Brutal art direction wrapper, keeps generated images on-brand without the
// caller thinking about it.
export function brandArtDirection(subject: string) {
  return `${subject}. Style: minimal, technical editorial illustration on a near-black dark blue ground (#020617), thin light strokes, restrained acid-lime (#C6F14A) accents, generous negative space, no text, no logos, no watermarks. Composed like a Distill.pub or engineering-blog hero image: abstract but structurally meaningful, not decorative clip art.`;
}

class OpenAiImageProvider implements ImageProvider {
  readonly name = "openai";

  configError(): string | null {
    if (!process.env.OPENAI_API_KEY) {
      return "Image generation is off: OPENAI_API_KEY is missing. Add it to engine/.env.local and restart to enable generated heroes and case-study art.";
    }
    return null;
  }

  async generate(opts: { prompt: string; size?: "1024x1024" | "1536x1024" | "1024x1536" }) {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.IMAGE_MODEL || "gpt-image-1",
        prompt: opts.prompt,
        size: opts.size || "1536x1024",
        n: 1,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Image API ${res.status}: ${body.slice(0, 300)}`);
    }
    const json = (await res.json()) as { data: Array<{ b64_json?: string }> };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("Image API returned no image data.");
    return { data: Buffer.from(b64, "base64"), mime: "image/png" };
  }
}

// Flux via BFL.ai. Async API: create a request, poll until Ready, download the
// signed sample URL (it expires within minutes, so we fetch the bytes here).
class BflFluxProvider implements ImageProvider {
  readonly name = "bfl";

  configError(): string | null {
    if (!process.env.BFL_API_KEY) {
      return "Image generation is off: BFL_API_KEY is missing. Add it to engine/.env.local and restart to enable Flux-generated heroes and case-study art.";
    }
    return null;
  }

  private dims(size?: string): { width: number; height: number } {
    // Flux wants multiples of 32
    if (size === "1024x1536") return { width: 928, height: 1440 };
    if (size === "1024x1024") return { width: 1024, height: 1024 };
    return { width: 1440, height: 928 };
  }

  async generate(opts: { prompt: string; size?: "1024x1024" | "1536x1024" | "1024x1536" }) {
    const key = process.env.BFL_API_KEY!;
    const model = process.env.BFL_MODEL || "flux-pro-1.1";
    const { width, height } = this.dims(opts.size);

    const create = await fetch(`https://api.bfl.ai/v1/${model}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-key": key },
      body: JSON.stringify({ prompt: opts.prompt, width, height, safety_tolerance: 2, output_format: "png" }),
    });
    if (!create.ok) {
      const body = await create.text();
      throw new Error(`Flux API ${create.status}: ${body.slice(0, 300)}`);
    }
    const { id, polling_url } = (await create.json()) as { id: string; polling_url?: string };
    const pollUrl = polling_url || `https://api.bfl.ai/v1/get_result?id=${id}`;

    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const poll = await fetch(pollUrl.includes("?") ? pollUrl : `${pollUrl}?id=${id}`, { headers: { "x-key": key } });
      if (!poll.ok) continue;
      const json = (await poll.json()) as { status: string; result?: { sample?: string } };
      if (json.status === "Ready") {
        const sample = json.result?.sample;
        if (!sample) throw new Error("Flux returned Ready with no image URL.");
        const img = await fetch(sample);
        if (!img.ok) throw new Error(`Could not download the generated image (${img.status}).`);
        return { data: Buffer.from(await img.arrayBuffer()), mime: "image/png" };
      }
      if (json.status === "Content Moderated" || json.status === "Request Moderated") {
        throw new Error("Flux declined the prompt (moderation). Rephrase and retry.");
      }
      if (json.status === "Error" || json.status === "Failed") {
        throw new Error(`Flux generation failed: ${JSON.stringify(json).slice(0, 200)}`);
      }
    }
    throw new Error("Flux generation timed out after two minutes.");
  }
}

const providers: Record<string, ImageProvider> = {
  bfl: new BflFluxProvider(),
  openai: new OpenAiImageProvider(),
};

export function getImageProvider(): ImageProvider {
  // Explicit IMAGE_PROVIDER wins; otherwise prefer Flux when its key exists.
  const name = process.env.IMAGE_PROVIDER || (process.env.BFL_API_KEY ? "bfl" : "openai");
  const p = providers[name];
  if (!p) throw new Error(`Unknown IMAGE_PROVIDER "${name}". Valid: ${Object.keys(providers).join(", ")}`);
  return p;
}
