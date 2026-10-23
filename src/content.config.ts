import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { figureNames } from "./lib/figures";

// エラーメッセージを日本語にする（CI のログで読めるように）
z.config(z.locales.ja());

// 文章（src/content/）の値をここで検証する。本番では編集画面（CMS）から入力された値もここで検証される。
// 文字数の上限などを超えるとビルドが失敗するので、デザインが崩れたまま公開されることはない。

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

const tone = z.enum(["light", "dark"]).default("light");

// 長文（設計論・要素のページ）は「ブロック」を上から並べて書く。
// 段落の text には [[要素の名前]] でリンク、**強調** が書ける（src/lib/inline.ts）。
const illustration = {
  // イラスト指定書（docs/illustrations.md）の番号。例: E3-01
  id: z.string().regex(/^[A-Z0-9]+-\d{2}$/, { message: "イラストの番号は E3-01 のような形で書いてください" }),
  caption: z.string().max(80),
  alt: z.string().max(120),
  // 画像ができたら public/uploads/illustrations/ に置いてパスを書く。空のあいだは「制作中」の枠が出る
  src: z.string().optional(),
  ratio: z.enum(["21:9", "16:9", "4:3", "1:1"]).default("16:9"),
};

const block = z.discriminatedUnion("type", [
  // 段落。note は欄外の注（出典や補足）
  z.object({ type: z.literal("p"), text: z.string().max(600), note: z.string().max(300).optional() }),
  z.object({ type: z.literal("figure"), name: z.enum(figureNames) }),
  z.object({ type: z.literal("illustration"), ...illustration }),
  z.object({
    type: z.literal("steps"),
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
]);

export type Block = z.infer<typeof block>;

// トップページは「説得の物語」として、番号付きの章（ストーリー）を上から並べる。
// どの章にも、見出し（title）だけ読んでも話がつながるように一文の主張を書く。
const story = {
  tone,
  // 見出しの上の小さな英語のラベル（例: Why）
  eyebrow: z.string().max(20),
  // 章の主張。見出しだけを順に読んでも話が通じるように書く
  title: z.string().max(30),
  // 見出しのすぐ下の一文（明朝体で大きく出る）
  lead: z.string().max(80),
  // 本文の段落。[[modeling]] で設計を知るページへのリンク、**強調** が書ける
  body: z.array(z.string().max(300)).min(1).max(3),
  illustration: z.object(illustration).optional(),
  // 章の最後に出す「詳しく読む」リンク
  link: z.object({ label: z.string().max(30), href: z.string() }).optional(),
};

const section = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hero"),
    eyebrow: z.string().max(60).optional(),
    title: z.string().max(30),
    lead: z.string().max(160),
    ctaLabel: z.string().max(20).optional(),
    ctaHref: z.string().optional(),
  }),
  // 左右の対比（「思いつき」→「よく考えられた設計」）
  z.object({
    type: z.literal("statement"),
    ...story,
    compare: z.object({
      fromLabel: z.string().max(20),
      toLabel: z.string().max(20),
      rows: z
        .array(z.object({ from: z.string().max(20), to: z.string().max(20) }))
        .min(1)
        .max(5),
    }),
  }),
  // 図を一つ見せる章
  z.object({ type: z.literal("figure"), ...story, figure: z.enum(figureNames) }),
  // 設計の地図：横に工程、縦に視点を並べた表。cells は工程と同じ数だけ書く
  z
    .object({
      type: z.literal("map"),
      ...story,
      steps: z
        .array(z.object({ title: z.string().max(10), sub: z.string().max(10) }))
        .min(2)
        .max(6),
      lenses: z
        .array(z.object({ design: reference("design"), cells: z.array(z.string().max(24)) }))
        .min(1)
        .max(5),
    })
    .refine((s) => s.lenses.every((l) => l.cells.length === s.steps.length), {
      message: "map の cells は、steps（工程）と同じ数だけ書いてください",
      path: ["lenses"],
    }),
  z.object({ type: z.literal("tags"), ...story, tags: z.array(z.string().max(12)).min(1).max(20) }),
  z.object({
    type: z.literal("cards"),
    ...story,
    items: z
      .array(z.object({ title: z.string().max(20), body: z.string().max(160), note: z.string().max(60).optional() }))
      .min(1)
      .max(4),
  }),
  z.object({
    type: z.literal("join"),
    eyebrow: z.string().max(20).optional(),
    title: z.string().max(30),
    body: z.string().max(200),
    traits: z
      .array(z.object({ title: z.string().max(10), body: z.string().max(40) }))
      .max(4)
      .default([]),
    closing: z.string().max(120).optional(),
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

// 「設計を知る」のページ（/design/〇〇/）。ファイル名がそのまま URL になる（例: modeling.yaml → /design/modeling/）
// layer で階層を分ける：
//   process … 設計のプロセス（工程）。章は工程ごと（kind: step）に書く
//   lens    … どの工程にも通じる視点（モデル化・ヒューマンインターフェース・データ分析）。
//             章は「設計との関係・使い方・歴史・いま・設計会では」をそろえる
const chapterKinds = ["concept", "step", "relation", "method", "history", "now", "activity"] as const;
const requiredKinds = {
  process: ["concept", "step", "history", "now", "activity"],
  lens: ["relation", "method", "history", "now", "activity"],
} as const;

const design = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/design" }),
  schema: z
    .object({
      title: z.string().max(20),
      en: z.string().max(30),
      layer: z.enum(["process", "lens"]),
      // 地図や一覧で並べる順番
      order: z.number().int().min(1),
      // 視点の短い言い方（例: モデルで考える）。地図の行の見出しになる
      short: z.string().max(12),
      question: z.string().max(40),
      summary: z.string().max(120),
      lead: z.string().max(300),
      hero: z.object(illustration).optional(),
      chapters: z
        .array(
          z.object({
            kind: z.enum(chapterKinds),
            // 章の見出しの上の小さなラベル（例: 工程 1）。省略すると kind から決まる
            label: z.string().max(12).optional(),
            heading: z.string().max(40),
            blocks: z.array(block).min(1).max(20),
          }),
        )
        .min(4)
        .max(12),
      references: z
        .array(z.object({ text: z.string().max(240), url: z.url().optional() }))
        .max(30)
        .default([]),
      related: z.array(reference("design")).max(4).default([]),
    })
    .superRefine((page, ctx) => {
      const missing = requiredKinds[page.layer].filter((k) => !page.chapters.some((c) => c.kind === k));
      if (missing.length > 0) {
        ctx.addIssue({
          code: "custom",
          path: ["chapters"],
          message: `layer: ${page.layer} のページには kind が ${missing.join(" / ")} の章が必要です`,
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
