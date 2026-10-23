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

**自分の PC の VS Code で、画面操作だけで見る場合**

1. 初回だけ：メニューの **Terminal** → **Run Task...** → **npm** → **npm: install**
2. メニューの **Terminal** → **Run Task...** → **npm** → **npm: dev**
   （出力をスキャンするか聞かれたら **Continue without scanning the task output**）
3. ターミナルに `Local http://localhost:4321/` と出たら、`Ctrl+Shift+P` → **Browser: Open Integrated Browser** を選び、アドレス欄に `http://localhost:4321/` を入れる（デザイン確認用は `http://localhost:4321/lab/`）
4. タブを右端へドラッグすると、コードと並べて見られる。ファイルを保存すると表示も更新される
5. 終わるときは、ターミナル右上のゴミ箱アイコンでサーバーを止める

## どこを触るか

| 場所                          | 中身                                                                   |
| ----------------------------- | ---------------------------------------------------------------------- |
| `src/components/sections/`    | セクションの見た目（Astro）                                            |
| `src/layouts/` / `src/pages/` | ページの枠・ページ                                                     |
| `src/scripts/motion.ts`       | アニメーション（GSAP / Lenis）                                         |
| `src/styles/global.css`       | 共通のスタイル                                                         |
| `tokens/tokens.json`          | 色・フォント・動きの値（デザイントークン）                             |
| `src/content/`                | 文章（トップページの構成は `src/content/pages/home.yaml`）             |
| `src/content/design/`         | 「設計を知る」のページ（`/design/〇〇/`）。YAML を足すとページが増える |
| `src/content/site/links.yaml` | GitHub・Discord のリンク                                               |
| `src/components/figures/`     | 図（一覧は `/lab/`）                                                   |
| `docs/writing-guide.md`       | 文章の書き方（調べたことと、このサイトの決まり）                       |
| `docs/illustrations.md`       | イラストの指定書（描く人向け）                                         |
| `public/uploads/`             | 画像                                                                   |
| `src/content.config.ts`       | 文章の入力ルール（文字数の上限など）                                   |

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
