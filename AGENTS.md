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
- `/lab/` はデザイン確認用ページ（トークン、図、全セクションの一覧）
- **文章を書く前に `docs/writing-guide.md` を読む**（Web の読まれ方と読みやすい文章について調べたことと、このサイトの決まり）
- トップページは「なぜ今、設計が大事なのか」を伝える長文。`home.yaml` の章（`type: chapter`）を並べ、各章は「読者の問い（eyebrow）→ 主張の見出し → 要点（point）→ 本文」。先頭の「3分で読むなら」は各章の見出しと要点から自動で作られる。人名や出典の注は本文に置かず、必要なら補足（`aside`）に入れる
- 長文は「ブロック」を並べて書く（`src/content.config.ts` の `block`、表示は `src/components/Blocks.astro`）。要点 `point`・問いかけ `question`・身近な例 `example`・補足 `aside`（折りたたみ）・小見出し `heading`・段落 `p` などを、大事さに合わせて使い分ける。トップページと「設計を知る」で同じブロックが使える
- 本文中の `[[modeling]]`、`[[modeling|モデル]]`、`[[process#step-2|要件を定める工程]]` は「設計を知る」のページ（や章）へのリンク、`**強調**` は強調になる（`src/lib/inline.ts`）
- 「設計を知る」（`/design/`）は `src/content/design/*.yaml`（ファイル名が URL）。**YAML を一つ足せば、一覧・地図・リンクに自動で加わる**。決まった章立ては無く、テーマが一番伝わる組み立てで書く。**階層は混ぜない**：`layer: process` は設計のプロセス（工程の章に `step` を書く）、`layer: lens` はどの工程にも通じる視点（`perStep` を書くと地図の表に出る）、`layer: topic` はそれ以外のテーマ
- 図は `src/components/figures/`（名前の一覧は `src/lib/figures.ts`）。トップページでは図を番号・出典なしで出す
- イラストは学生に描いてもらう。指定は `docs/illustrations.md`、画像ができるまでは「制作中」の枠が出る
- GitHub と Discord のリンクは `src/content/site/links.yaml`（ヘッダーとフッターのアイコン、入部の章の Discord ボタン）
- 活動の段階（なんでもプレゼン〜大プレゼン）、発案者・設計仲間・投資家の役割、プロジェクト紹介は古い情報なので使わない

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
