import { createHighlighter, createJavaScriptRegexEngine } from "shiki"

/**
 * Server-only. Importing this pulls shiki's grammars in, so it must never be
 * reachable from a `"use client"` module.
 */

type Highlighter = ReturnType<typeof createHighlighter>

let highlighter: Highlighter | undefined

/**
 * One highlighter per process, built lazily. The JS regex engine skips the
 * oniguruma wasm entirely — plenty for the single grammar we load, and it keeps
 * the vitest run off wasm.
 */
function getHighlighter(): Highlighter {
  return (highlighter ??= createHighlighter({
    langs: ["tsx"],
    themes: ["github-light", "github-dark"],
    engine: createJavaScriptRegexEngine(),
  }))
}

/**
 * TSX → HTML carrying both themes as CSS variables. `defaultColor: false` means
 * neither theme is applied inline; the rules in `app/globals.css` pick one from
 * the `.dark` class, so switching themes needs no re-highlight.
 */
export async function highlight(code: string): Promise<string> {
  const shiki = await getHighlighter()
  return shiki.codeToHtml(code, {
    lang: "tsx",
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  })
}
