import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { figureNames } from "./lib/figures";

// エラーメッセージを日本語にする（CI のログで読めるように）
z.config(z.locales.ja());

// 文章（src/content/）の値をここで検証する。本番では編集画面（CMS）から入力された値もここで検証される。
// 文字数の上限などを超えるとビルドが失敗するので、デザインが崩れたまま公開されることはない。
// 文章の書き方の決まりは docs/writing-guide.md にまとめている。

const news = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/news" }),
  schema: z.object({
    title: z.string().max(60),
    date: z.coerce.date(),
    summary: z.string().max(140).optional(),
    cover: z.string().optional(),
    coverAlt: z.string().max(100).optional(),
    draft: z.boolean().default(false),
  }),
});

const illustration = {
  // イラスト指定書（docs/illustrations.md）の番号。例: PR-01
  id: z.string().regex(/^[A-Z0-9]+-\d{2}$/, { message: "イラストの番号は PR-01 のような形で書いてください" }),
  caption: z.string().max(80),
  alt: z.string().max(120),
  // 画像ができたら public/uploads/illustrations/ に置いてパスを書く。空のあいだは「制作中」の枠が出る
  src: z.string().optional(),
  ratio: z.enum(["21:9", "16:9", "4:3", "1:1"]).default("16:9"),
};

// ── ブロック ──
// 長文は「ブロック」を上から並べて書く。トップページの章と「設計を知る」のページで同じブロックが使える。
// 文章の中には [[modeling]]（ページへのリンク）、[[process#step-2|要件を定める工程]]（章へのリンク）、
// **強調** が書ける（src/lib/inline.ts）。表示は src/components/Blocks.astro。
const block = z.discriminatedUnion("type", [
  // 段落。note は欄外の注（出典や補足）。トップページではなるべく使わない
  z.object({ type: z.literal("p"), text: z.string().max(600), note: z.string().max(300).optional() }),
  // 章の中の小見出し。見出しだけ拾い読みしても話がわかるように、主張の形で書く
  z.object({ type: z.literal("heading"), text: z.string().max(40) }),
  // 要点。その部分でいちばん言いたいことを一、二文で。拾い読みする人はここだけ読む
  z.object({ type: z.literal("point"), text: z.string().max(160) }),
  // 読者への問いかけ。answer を書くと「答えを見る」で開ける
  // open: true にすると答えを最初から開いておく（拾い読みする人にも見せたい答えのとき）
  z.object({
    type: z.literal("question"),
    text: z.string().max(100),
    answer: z.string().max(240).optional(),
    open: z.boolean().default(false),
  }),
  // 身近な例。抽象的な話の前後に、具体的な場面を一つ置く
  z.object({ type: z.literal("example"), title: z.string().max(30).optional(), text: z.string().max(400) }),
  // 補足。折りたたんで出す。読み飛ばしても本筋がわかる内容（数字の出どころ、細かい事情など）だけを書く
  z.object({
    type: z.literal("aside"),
    title: z.string().max(40),
    body: z.array(z.string().max(500)).min(1).max(6),
  }),
  // 箇条書き
  z.object({ type: z.literal("list"), items: z.array(z.string().max(160)).min(1).max(8) }),
  z.object({ type: z.literal("figure"), name: z.enum(figureNames) }),
  z.object({ type: z.literal("illustration"), ...illustration }),
  z.object({
    type: z.literal("steps"),
    // true … 順番のある手順（手順 1, 2…と番号が付く）／ false … 順番の無い手法の一覧（番号なし）
    ordered: z.boolean().default(true),
    items: z
      .array(z.object({ title: z.string().max(30), body: z.string().max(240) }))
      .min(1)
      .max(8),
  }),
  z.object({
    type: z.literal("timeline"),
    items: z
      .array(z.object({ year: z.string().max(14), title: z.string().max(40), body: z.string().max(200) }))
      .min(1)
      .max(16),
  }),
  // 左右の対比（「単純な思いつき」→「よく考えられた設計」など）
  z.object({
    type: z.literal("compare"),
    fromLabel: z.string().max(20),
    toLabel: z.string().max(20),
    rows: z
      .array(z.object({ from: z.string().max(20), to: z.string().max(20) }))
      .min(1)
      .max(6),
  }),
  // 言葉を札にして並べる
  z.object({
    type: z.literal("tags"),
    label: z.string().max(30).optional(),
    items: z.array(z.string().max(12)).min(1).max(20),
  }),
  // 見出し＋本文のカード
  z.object({
    type: z.literal("cards"),
    items: z
      .array(z.object({ title: z.string().max(20), body: z.string().max(160), note: z.string().max(60).optional() }))
      .min(1)
      .max(6),
  }),
  // 設計の地図（工程 × 視点）。中身は src/content/design/ から自動で作る。新しい視点のページを足すと、ここにも出る
  z.object({ type: z.literal("map"), variant: z.enum(["compact", "full"]).default("compact") }),
  // 視点（lens）のページで、その視点を工程ごとにどう使うか（ページの perStep から作る）
  z.object({ type: z.literal("per-step") }),
  // ほかのページへの「詳しく読む」リンク
  z.object({ type: z.literal("link"), label: z.string().max(40), href: z.string() }),
]);

export type Block = z.infer<typeof block>;

// ── トップページ ──
// 章（chapter）を上から並べた長文。先頭の summary は、各章の見出しと要点から自動で作る「拾い読み用のまとめ」。
const section = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hero"),
    eyebrow: z.string().max(60).optional(),
    title: z.string().max(30),
    lead: z.string().max(160),
    ctaLabel: z.string().max(20).optional(),
    ctaHref: z.string().optional(),
    // 二つ目のボタン
    cta2Label: z.string().max(20).optional(),
    cta2Href: z.string().optional(),
  }),
  // 拾い読み用のまとめ。後ろに続く章の見出しと要点を並べる（中身は自動）
  z.object({ type: z.literal("summary"), title: z.string().max(30), lead: z.string().max(120).optional() }),
  // 長文の章。見出し（title）は主張、eyebrow は読者の問い、point はこの章の要点（まとめにも出る）
  z.object({
    type: z.literal("chapter"),
    // 章へのリンク用の名前（例: why-now → /#why-now）。英小文字とハイフン
    id: z.string().regex(/^[a-z0-9-]+$/, { message: "id は英小文字・数字・ハイフンで書いてください" }),
    eyebrow: z.string().max(30),
    title: z.string().max(30),
    point: z.string().max(120),
    blocks: z.array(block).min(1).max(30),
  }),
  z.object({
    type: z.literal("join"),
    eyebrow: z.string().max(20).optional(),
    title: z.string().max(30),
    body: z.string().max(200),
    // traits の上に出す小見出し（例：設計会で身につく力）
    traitsTitle: z.string().max(20).optional(),
    traits: z
      .array(z.object({ title: z.string().max(10), body: z.string().max(40) }))
      .max(4)
      .default([]),
    formUrl: z
      .union([z.literal(""), z.url({ message: "入部フォームの URL は https:// から始まる形で入力してください" })])
      .optional(),
    buttonLabel: z.string().max(20),
  }),
  z.object({
    type: z.literal("info"),
    title: z.string().max(40),
    items: z
      .array(z.object({ label: z.string().max(12), value: z.string().max(60) }))
      .min(1)
      .max(10),
  }),
  z.object({
    type: z.literal("news"),
    title: z.string().max(40),
    limit: z.number().int().min(1).max(6).default(3),
  }),
]);

export type Section = z.infer<typeof section>;

const pages = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string().max(40),
    description: z.string().max(160),
    sections: z.array(section).min(1),
  }),
});

// ── 「設計を知る」のページ（/design/〇〇/） ──
// ファイル名がそのまま URL になる（例: modeling.yaml → /design/modeling/）。ファイルを足せばページが増える。
// layer で階層を分ける（混ぜない）：
//   process … 設計のプロセス（工程）。工程の章には step（正式な呼び名）を書く。地図の列になる
//   lens    … どの工程にも通じる視点（モデル化・ヒューマンインターフェース・データ分析…）。地図の行になる
//   topic   … 工程にも視点にも当てはまらないテーマ（一覧の「そのほかのテーマ」に出る）
// 章の並びや中身は決めていない。そのテーマがいちばん伝わる組み立てで書く。
const design = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/design" }),
  schema: z
    .object({
      title: z.string().max(20),
      en: z.string().max(30),
      layer: z.enum(["process", "lens", "topic"]),
      // 地図や一覧で並べる順番（同じ layer の中で）
      order: z.number().int().min(1),
      // 短い言い方（例: モデルで考える）。地図の行の見出しや一覧のカードに出る
      short: z.string().max(12),
      question: z.string().max(40),
      summary: z.string().max(120),
      lead: z.string().max(300),
      hero: z.object(illustration).optional(),
      chapters: z
        .array(
          z.object({
            // 章へのリンク用の名前（省略すると自動。工程の章は step-1, step-2…）
            id: z
              .string()
              .regex(/^[a-z0-9-]+$/)
              .optional(),
            // 見出しの上の小さなラベル（省略可）
            label: z.string().max(20).optional(),
            heading: z.string().max(40),
            // 工程の章だけ：正式な呼び名（例: 要件定義）。これがある章が「工程」として地図に並ぶ
            step: z.string().max(10).optional(),
            blocks: z.array(block).min(1).max(30),
          }),
        )
        .min(1)
        .max(16),
      references: z
        .array(z.object({ text: z.string().max(240), url: z.url().optional() }))
        .max(30)
        .default([]),
      related: z.array(reference("design")).max(4).default([]),
      // 視点（lens）のページ：設計のプロセスの各工程で、この視点をどう使うか（工程の順に、工程の数だけ書く）。
      // cell は地図の表のマスに、body は「工程ごとの使い方」（ブロック type: per-step）に出る。
      // まだ書けていなければ省略してよい（地図では空欄になる）
      perStep: z
        .array(z.object({ cell: z.string().max(24), body: z.string().max(240) }))
        .max(8)
        .optional(),
    })
    .superRefine((page, ctx) => {
      if (page.layer === "process" && !page.chapters.some((c) => c.step)) {
        ctx.addIssue({
          code: "custom",
          path: ["chapters"],
          message: "設計のプロセス（layer: process）のページには、step を書いた工程の章が必要です",
        });
      }
      if (page.layer !== "lens" && page.perStep) {
        ctx.addIssue({
          code: "custom",
          path: ["perStep"],
          message: "perStep は視点（layer: lens）のページだけに書けます",
        });
      }
    }),
});

// サイト全体のリンク（ヘッダーのアイコンなど）
const site = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/site" }),
  schema: z.object({
    github: z.union([z.literal(""), z.url()]),
    // Discord の招待リンク。空のあいだは「準備中」のアイコンになる
    discord: z.union([z.literal(""), z.url()]),
  }),
});

export const collections = { news, pages, design, site };
