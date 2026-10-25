// 文章（src/content/ の YAML）が、書き方の決まり（docs/writing-guide.md）を守っているかを確かめる。
// 人の記憶だけに頼らず、機械で見つけられる決まりはここで見つける。見つかったら、場所を出して失敗する。
//   - 表記：Web → ウェブ、スマホ → スマートフォン、使い手 → 使う人、要求定義 → 要件定義、長音（コンピューター など）
//   - 数を数える漢数字（二つ・三人…）→ 算用数字（2つ・3人…）
//   - 読み方の指示（「読み飛ばしてよい」「3分で読める」など）
//   - 二重否定の決まった形（「ないことはない」など）
//   - 一段落（YAML の 1 行）に強調（**…**）が2か所以上
//   - 同じ出典の実例が、2つ以上のページにある（同じ実例は1ページにだけ置く）
//   - public/uploads/ の画像が docs/image-credits.md に載っていない
// 参考文献（references:）とリンクの表示名（[…](https://…)）は、作品の名前なのでそのまま使う（調べない）。
// 使い方: npm run check:content
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const files = [
  ...readdirSync("src/content/design").map((f) => join("src/content/design", f)),
  ...readdirSync("src/content/pages").map((f) => join("src/content/pages", f)),
].filter((f) => f.endsWith(".yaml"));

// [表記の決まり, 見つける正規表現, 直し方]
const rules = [
  [/Web/, "「Web」は「ウェブ」と書く"],
  [/スマホ/, "「スマホ」は「スマートフォン」と書く"],
  [/使い手/, "「使い手」は「使う人」「利用者」と書く"],
  [/要求定義/, "「要求定義」は「要件定義」と書く"],
  [/(コンピュータ|プリンタ|パラメータ|ライブラリ|ユーザ(?!ビリティ))(?!ー)/, "外来語の語末の長音「ー」を付ける（コンピューター など）"],
  [/(?<![一二三四五六七八九十百千第])[二三四五六七八九](つ|人|件|か所)/, "数を数えるときは算用数字で書く（2つ、3人）"],
  [/読み飛ば|分で読め|読まなくても/, "読み方の指示は書かない（拾い読みしやすさは見た目と構成でつくる）"],
  [/ないことはない|なくはない|ないわけではない|なくもない/, "二重否定は使わない"],
];

const problems = [];
const sources = new Map(); // 実例の出典の URL → それを使っているファイル
const images = [];

for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  let inReferences = false;
  lines.forEach((raw, i) => {
    if (/^\S/.test(raw)) inReferences = /^references:/.test(raw);
    if (inReferences || /^\s*#/.test(raw)) return;
    const where = `${file}:${i + 1}`;
    // リンクの表示名と URL は調べない（作品や記事の名前は原文のまま）
    const text = raw.replace(/\[[^\[\]]*\]\(https:\/\/[^\s)]+\)/g, "").replace(/https?:\/\/\S+/g, "");
    for (const [re, message] of rules) {
      const m = text.match(re);
      if (m) problems.push(`${where}: ${message}（「${m[0]}」）`);
    }
    if ((raw.match(/\*\*[^*]+\*\*/g) ?? []).length > 1) problems.push(`${where}: 強調（**…**）は一段落に1か所まで`);
    const source = raw.match(/^\s+source:\s*(.*)$/);
    if (source) {
      for (const [, url] of source[1].matchAll(/\]\((https:\/\/[^\s)]+)\)/g)) {
        if (!sources.has(url)) sources.set(url, new Set());
        sources.get(url).add(file);
      }
    }
    const image = raw.match(/^\s+src:\s*["']?(\/uploads\/\S+?)["']?\s*$/);
    if (image) images.push([where, image[1]]);
  });
}

for (const [url, where] of sources) {
  if (where.size > 1) {
    problems.push(`同じ出典の実例が ${where.size} ページにあります（1ページにだけ置き、ほかはリンクにする）: ${url}\n      ${[...where].join(", ")}`);
  }
}

const credits = readFileSync("docs/image-credits.md", "utf8");
for (const [where, src] of images) {
  if (!credits.includes(`public${src}`)) problems.push(`${where}: 画像 ${src} を docs/image-credits.md に書いてください`);
}

if (problems.length > 0) {
  console.error(`書き方の決まりに合わないところが ${problems.length} か所あります（docs/writing-guide.md）:\n` + problems.map((p) => "  - " + p).join("\n"));
  process.exit(1);
}
console.log("文章は、書き方の決まりに合っています。");
