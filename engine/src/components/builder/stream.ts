// Read a text/plain streaming Response, reporting the accumulated text on each chunk.
export async function readTextStream(res: Response, onText: (soFar: string) => void): Promise<string> {
  if (!res.body) throw new Error("No response body.");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    onText(full);
  }
  full += decoder.decode();
  return full;
}
