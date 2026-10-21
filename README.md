# 設計会ホームページ（プロトタイプ）

> ⚠️ ここはデザインと中身を固めるための**プロトタイプ用**のリポジトリです。
> 本番のリポジトリは [sekkeikai/sekkeikai-opu](https://github.com/sekkeikai/sekkeikai-opu) です（編集画面・CI・公開の設定はそちら）。

## 動かし方

**GitHub Codespaces（何も入れなくてよい）**

1. このリポジトリで「Code」→「Codespaces」→「Create codespace」
2. 準備が終わったらターミナルで `npm run dev` → 「ブラウザーで開く」
3. AI と一緒に作るなら、同じターミナルで `claude`

**自分の PC で**（Node.js 24 系が必要）

```bash
npm ci
npm run dev      # → http://localhost:4321（トップ）と http://localhost:4321/lab/（デザイン確認用）
```

## どこを触るか

| 場所                          | 中身                                                       |
| ----------------------------- | ---------------------------------------------------------- |
| `src/components/sections/`    | セクションの見た目（Astro）                                |
| `src/layouts/` / `src/pages/` | ページの枠・ページ                                         |
| `src/scripts/motion.ts`       | アニメーション（GSAP / Lenis）                             |
| `src/styles/global.css`       | 共通のスタイル                                             |
| `tokens/tokens.json`          | 色・フォント・動きの値（デザイントークン）                 |
| `src/content/`                | 文章（トップページの構成は `src/content/pages/home.yaml`） |
| `public/uploads/`             | 画像                                                       |
| `src/content.config.ts`       | 文章の入力ルール（文字数の上限など）                       |

## コマンド

```bash
npm run dev      # 開発用サーバー
npm run check    # 型チェック
npm run build    # dist/ に出力
npm run preview  # build したものを確認
```

## 本番に移すとき

上の表の場所（`src/`、`tokens/`、`public/uploads/`）を sekkeikai-opu に PR で移します。
新しいセクションを作った場合は、sekkeikai-opu 側で編集画面の入力欄（`public/admin/config.yml`）も足します。

## ライセンス

- プログラム: [MIT License](LICENSE)
- 文章・写真・ロゴ・デザインなどのコンテンツ: © 設計会。詳しくは [CONTENT-LICENSE.md](CONTENT-LICENSE.md)
