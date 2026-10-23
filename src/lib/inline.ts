// 文章の中に書ける、ごく簡単な書式を読み取る。
//   [[modeling]]          … 設計を知るページ（/design/modeling/）へのリンク。表示はページの名前
//   [[modeling|モデル]]   … 表示する文字を変えたリンク
//   **大事なこと**        … 強調
// HTML は書けない（そのまま文字として表示される）ので、編集画面から入力しても安全。
export type InlineToken =
  | { kind: "text"; value: string }
  | { kind: "strong"; value: string }
  | { kind: "element"; slug: string; label?: string };

const PATTERN = /\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]|\*\*([^*]+)\*\*/g;

export function parseInline(source: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let last = 0;
  for (const match of source.matchAll(PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) tokens.push({ kind: "text", value: source.slice(last, index) });
    if (match[1]) tokens.push({ kind: "element", slug: match[1], label: match[2] });
    else tokens.push({ kind: "strong", value: match[3] });
    last = index + match[0].length;
  }
  if (last < source.length) tokens.push({ kind: "text", value: source.slice(last) });
  return tokens;
}

// 書式の記号を取り除いた素の文字列（読了時間の計算や、ページの説明文に使う）
export function plainText(source: string): string {
  return parseInline(source)
    .map((t) => (t.kind === "element" ? (t.label ?? "") : t.value))
    .join("");
}
