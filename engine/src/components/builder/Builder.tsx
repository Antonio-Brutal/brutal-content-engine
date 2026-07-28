"use client";

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, SectionLabel } from "@/components/ui";
import { Markdown } from "@/components/markdown";
import { createSolutionAction, saveDraftDocAction, updateSolutionAction } from "@/app/solutions/new/actions";
import { readTextStream } from "./stream";

export type Turn = { role: "user" | "assistant"; content: string; at: number };
export type MediaRow = { id: string; kind: string; mime: string };
type Draft = { text: string; streaming: boolean };

// Resume mode: /solutions/new?solutionId=… loads the persisted solution and
// hands it in here, the builder then edits that row instead of creating a new one.
export type BuilderInitial = {
  solutionId: string;
  title: string;
  dumpRaw: string;
  links: string;
  interviewLog: Turn[];
  media: MediaRow[];
};

export function Builder({
  initialConfigError,
  initial,
}: {
  initialConfigError: string | null;
  initial?: BuilderInitial;
}) {
  const router = useRouter();

  const [banner, setBanner] = useState<string | null>(initialConfigError);
  const [solutionId, setSolutionId] = useState<string | null>(initial?.solutionId ?? null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [dump, setDump] = useState(initial?.dumpRaw ?? "");
  const [links, setLinks] = useState(initial?.links ?? "");
  const [saved, setSaved] = useState(false);

  const [mediaRows, setMediaRows] = useState<MediaRow[]>(initial?.media ?? []);
  const [uploadNote, setUploadNote] = useState<string | null>(null);

  const [turns, setTurns] = useState<Turn[]>(initial?.interviewLog ?? []);
  const [streamText, setStreamText] = useState<string | null>(null);
  const [chatNote, setChatNote] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, streamText]);

  function flashSaved() {
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 1600);
  }

  async function persistIntake() {
    if (!solutionId) return;
    await updateSolutionAction(solutionId, { title: title.trim() || "Untitled solution", dumpRaw: dump, links });
    flashSaved();
  }

  async function runInterview(sid: string, history: Turn[]) {
    setChatNote(null);
    setStreamText("");
    let res: Response;
    try {
      res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solutionId: sid,
          messages: history.map((t) => ({ role: t.role, content: t.content })),
        }),
      });
    } catch {
      setStreamText(null);
      setChatNote("Network error. Send again to retry.");
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setBanner((data && data.error) || `The interview call failed (${res.status}).`);
      setStreamText(null);
      return;
    }
    try {
      const full = await readTextStream(res, setStreamText);
      const next: Turn[] = [...history, { role: "assistant", content: full, at: Date.now() }];
      setTurns(next);
      setStreamText(null);
      void updateSolutionAction(sid, { interviewLog: JSON.stringify(next) });
    } catch {
      setStreamText(null);
      setChatNote("The stream was interrupted. Send again to retry.");
    }
  }

  async function ensureSolution(): Promise<string> {
    if (solutionId) return solutionId;
    const { id } = await createSolutionAction({ title: title.trim() || "Untitled solution", dumpRaw: dump, links });
    setSolutionId(id);
    return id;
  }

  async function startInterview() {
    if (!title.trim() || starting) return;
    setStarting(true);
    try {
      const id = await ensureSolution();
      await updateSolutionAction(id, { title: title.trim(), dumpRaw: dump, links });
      await runInterview(id, []);
    } finally {
      setStarting(false);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || !solutionId || streamText !== null) return;
    const next: Turn[] = [...turns, { role: "user", content: text, at: Date.now() }];
    setTurns(next);
    setInput("");
    await runInterview(solutionId, next);
  }

  function onChatKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    const sid = await ensureSolution();
    setUploadNote(null);
    for (const file of files) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        setUploadNote(`${file.name}: only image or video files.`);
        continue;
      }
      const fd = new FormData();
      fd.set("file", file);
      fd.set("solutionId", sid);
      fd.set("kind", file.type.startsWith("video/") ? "clip" : "screenshot");
      const res = await fetch("/api/media", { method: "POST", body: fd });
      if (res.ok) {
        const row = (await res.json()) as MediaRow;
        setMediaRows((m) => [...m, row]);
      } else {
        const data = await res.json().catch(() => null);
        setUploadNote((data && data.error) || `${file.name}: upload failed.`);
      }
    }
  }

  async function draftDoc() {
    if (!solutionId || (draft && draft.streaming)) return;
    setDraft({ text: "", streaming: true });
    let res: Response;
    try {
      res = await fetch("/api/draft-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solutionId }),
      });
    } catch {
      setDraft(null);
      setBanner("Network error while drafting. Try again.");
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setBanner((data && data.error) || `Drafting failed (${res.status}).`);
      setDraft(null);
      return;
    }
    try {
      const full = await readTextStream(res, (t) => setDraft({ text: t, streaming: true }));
      setDraft({ text: full, streaming: false });
    } catch {
      setDraft(null);
      setBanner("The draft stream was interrupted. Try again.");
    }
  }

  async function saveAndOpen() {
    if (!solutionId || !draft || draft.streaming || saving) return;
    setSaving(true);
    try {
      await saveDraftDocAction(solutionId, draft.text);
      router.push(`/solutions/${solutionId}`);
    } finally {
      setSaving(false);
    }
  }

  const interviewBusy = streamText !== null;

  return (
    <div>
      {banner ? (
        <div className="mb-6 rounded-lg border border-(--amber) bg-[rgba(245,166,35,0.08)] px-4 py-3">
          <p className="label mb-1 text-(--amber)">Engine unavailable.</p>
          <p className="text-sm text-(--amber)">{banner}</p>
        </div>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* The dump */}
        <Card>
          <div className="flex items-baseline justify-between">
            <SectionLabel>The dump.</SectionLabel>
            {saved ? <span className="label text-(--lime)">Saved.</span> : null}
          </div>
          <div className="grid gap-5">
            <div>
              <label className="label mb-2 block" htmlFor="b-title">
                Title.
              </label>
              <input
                id="b-title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={persistIntake}
                placeholder="What Brutal built, in one line"
              />
            </div>
            <div>
              <label className="label mb-2 block" htmlFor="b-dump">
                Everything you know.
              </label>
              <textarea
                id="b-dump"
                className="textarea min-h-[220px]"
                value={dump}
                onChange={(e) => setDump(e.target.value)}
                onBlur={persistIntake}
                placeholder="Everything you know: what was built, for whom, numbers, context."
              />
            </div>
            <div>
              <label className="label mb-2 block" htmlFor="b-links">
                Links.
              </label>
              <textarea
                id="b-links"
                className="textarea min-h-[80px]"
                value={links}
                onChange={(e) => setLinks(e.target.value)}
                onBlur={persistIntake}
                placeholder="One URL per line."
              />
            </div>
            <div>
              <p className="label mb-2">Screenshots &amp; clips.</p>
              <div className="grid gap-3">
                <div>
                  <label className="btn cursor-pointer">
                    Upload files
                    <input type="file" className="hidden" multiple accept="image/*,video/*" onChange={onFiles} />
                  </label>
                  <p className="mt-2 text-sm text-(--muted)">
                    Images and clips land in this solution&apos;s media library, engines place them into pages and case
                    studies by stable id.
                  </p>
                </div>
                {mediaRows.length ? (
                  <div className="flex flex-wrap gap-2">
                    {mediaRows.map((m) =>
                      m.mime.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={m.id}
                          src={`/api/media/${m.id}`}
                          alt=""
                          className="h-16 w-16 rounded-md border hairline object-cover"
                        />
                      ) : (
                        <span key={m.id} className="flex h-16 w-16 items-center justify-center rounded-md border hairline">
                          <span className="pill pill-draft">clip</span>
                        </span>
                      )
                    )}
                  </div>
                ) : null}
                {uploadNote ? <p className="text-sm text-(--red)">{uploadNote}</p> : null}
              </div>
            </div>
            {!solutionId ? (
              <div>
                <button className="btn btn-primary" onClick={startInterview} disabled={!title.trim() || starting}>
                  {starting ? "Starting" : "Start interview"}
                </button>
                {!title.trim() ? <p className="mt-2 text-sm text-(--muted)">Give it a title first.</p> : null}
              </div>
            ) : null}
          </div>
        </Card>

        {/* The interview */}
        <Card className="flex min-h-[520px] flex-col">
          <SectionLabel>The interview.</SectionLabel>
          {!solutionId ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="max-w-xs text-center text-sm text-(--muted)">
                Give it a title, dump what you have, and hit Start interview. One question at a time until the story is
                out.
              </p>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="max-h-[440px] min-h-[280px] flex-1 space-y-5 overflow-y-auto pr-1">
                {turns.map((t, i) => (
                  <div key={`${t.at}-${i}`}>
                    <p className="label mb-1">{t.role === "user" ? "You." : "Interviewer."}</p>
                    {t.role === "user" ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{t.content}</p>
                    ) : (
                      <Markdown md={t.content} />
                    )}
                  </div>
                ))}
                {streamText !== null ? (
                  <div>
                    <p className="label mb-1">Interviewer.</p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{streamText || "…"}</p>
                  </div>
                ) : null}
              </div>
              {chatNote ? <p className="mt-2 text-sm text-(--red)">{chatNote}</p> : null}
              <div className="mt-4 flex gap-2 border-t hairline pt-4">
                <input
                  className="input"
                  placeholder="Answer, then Enter."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onChatKeyDown}
                  disabled={interviewBusy}
                />
                <button className="btn" onClick={send} disabled={interviewBusy || !input.trim()}>
                  Send
                </button>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  className="btn btn-primary"
                  onClick={draftDoc}
                  disabled={interviewBusy || (draft ? draft.streaming : false)}
                >
                  {draft && draft.streaming ? "Drafting" : "Draft the doc"}
                </button>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* The doc */}
      {draft ? (
        <Card className="mt-6">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <SectionLabel>The doc.</SectionLabel>
            {draft.streaming ? (
              <span className="label">Drafting.</span>
            ) : (
              <div className="flex gap-2">
                <button className="btn" onClick={draftDoc}>
                  Redraft
                </button>
                <button className="btn btn-primary" onClick={saveAndOpen} disabled={saving}>
                  {saving ? "Saving" : "Save & open solution"}
                </button>
              </div>
            )}
          </div>
          {draft.streaming ? (
            <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-[rgba(248,250,252,0.85)]">
              {draft.text || "…"}
            </pre>
          ) : (
            <Markdown md={draft.text} />
          )}
        </Card>
      ) : null}
    </div>
  );
}
