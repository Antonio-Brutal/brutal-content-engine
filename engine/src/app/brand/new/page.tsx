import Link from "next/link";
import { PageTitle } from "@/components/ui";
import { createEntry } from "../actions";

export default function NewVaultEntryPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/brand" className="label transition-colors hover:text-(--text)">
        Back to vault.
      </Link>

      <div className="mt-4">
        <PageTitle sub="Docs and standing rules feed every engine prompt while active. Prompt overrides append operator instructions to a single engine's system prompt.">
          Add document
        </PageTitle>
      </div>

      <form action={createEntry} className="card grid gap-5 p-6">
        <div>
          <label className="label mb-2 block" htmlFor="kind">
            Kind.
          </label>
          <select id="kind" name="kind" className="select" defaultValue="doc">
            <option value="doc">Doc</option>
            <option value="rule">Standing rule</option>
            <option value="prompt_override">Prompt override</option>
          </select>
          <p className="mt-2 text-xs text-(--muted)">
            Prompt override convention: title the entry override:&lt;engine&gt; (blog, page, tweet, linkedin,
            case_study, solution) and its content is appended to that engine&apos;s system prompt as operator
            instructions that win.
          </p>
        </div>

        <div>
          <label className="label mb-2 block" htmlFor="title">
            Title.
          </label>
          <input id="title" name="title" className="input" required placeholder="Editorial Style Pack" />
        </div>

        <div>
          <label className="label mb-2 block" htmlFor="contentMd">
            Content.
          </label>
          <textarea
            id="contentMd"
            name="contentMd"
            className="textarea font-mono text-[13px] leading-relaxed"
            rows={16}
            required
            placeholder="Markdown."
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary">
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
