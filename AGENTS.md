# AGENTS.md — AI コーディングツール向けのプロジェクト説明

> **このリポジトリ（NS28cse/sekkeikai-homepage）はプロトタイプ用です。本番の正本は [sekkeikai/sekkeikai-opu](https://github.com/sekkeikai/sekkeikai-opu)。**
>
> - 目的は、トップページなどのレイアウト・デザイン・文章を、作り手と会話しながら素早く固めること
> - 編集画面（CMS）・CI・Cloudflare などの本番の仕組みはここには無い。足さない（本番の準備は sekkeikai-opu の Issue #7）
> - 完成したら `src/`、`tokens/`、`public/uploads/` を sekkeikai-opu に PR で移す。新しいセクションを足した場合は、移すときに sekkeikai-opu の `public/admin/config.yml` にも入力欄を足す

## 概要

- 大学サークル「設計会」のサイト。Astro 7（静的出力）+ Tailwind CSS 4 + GSAP/Lenis
- 文章は `src/content/`（トップページの構成は `src/content/pages/home.yaml`）。入力ルールの検証は `src/content.config.ts`（zod）
- デザイントークンの正本は `tokens/tokens.json`（DTCG 形式）。`src/styles/tokens.css` は生成物で Git 管理外
- `/lab/` はデザイン確認用ページ（トークンと全セクションの一覧）

## コマンド

- `npm run dev` … 開発用サーバー（http://localhost:4321）
- `npm run check` … 型チェック
- `npm run build` … `dist/` に出力

## 作業の進め方

- 変更したら `npm run build` が通ることを確かめ、可能ならスクリーンショット（PC 幅とスマホ幅）で見た目を確認して作り手に見せる
- 案を比べたいときは、セクションのバリエーションを `/lab/` に並べて見比べられるようにする

## ルール（本番でも同じ）

- UI の文言・コメントは日本語。部員の多くはプログラミング初心者なので、コメントは「何のためか」を平易に書く
- セクションを追加・変更したら、`src/components/sections/*.astro`、`src/content.config.ts`、`src/components/SectionRenderer.astro` をそろえる。文字数上限は zod に書く（本番の CMS の `maxlength` と同じ値になる）
- 色・フォント・動きの値をコードに直接書かない。`tokens/tokens.json` に足して Tailwind のクラスや CSS 変数で使う
- アニメーションは `src/scripts/motion.ts` に集約。`prefers-reduced-motion: reduce` のときは動かさない。スマホ（pointer: coarse）では Lenis を使わない
- 画像には意味のある `alt`（装飾なら `alt=""`）。見出しの階層を飛ばさない
- 代表者の氏名はサイトに載せてよいが、年度ごとに変わるのでコードに直接書かず、`home.yaml` の団体概要（info セクション）に置く
- 学籍番号・大学のメールアドレス・個人の連絡先はコード・コンテンツ・サンプルデータに入れない
- 依存パッケージを追加するときは理由を説明する。CDN からのスクリプト読み込みは増やさない
