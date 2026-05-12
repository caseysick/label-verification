export function WorkbenchHeader() {
  return (
    <header className="space-y-3">
      <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Assistive prototype (not a COLA replacement)
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Label verification assistant
      </h1>
      <p className="max-w-3xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
        This tool compares text extracted from a beverage label image with the
        structured application fields you enter. Results are{" "}
        <strong>assistive only</strong>; reviewers must exercise judgment,
        especially when OCR quality is poor or wording is nuanced.
      </p>
    </header>
  );
}
