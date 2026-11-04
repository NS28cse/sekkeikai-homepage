# Cloudflare で公開するまでの準備作業（2026-10-27）

サイト（sekkeikai/sekkeikai-opu）を Cloudflare Workers で公開し、編集画面（`/admin/`）に GitHub でログインできるようにした作業の記録です。次の代の人が同じところで迷わないように、つまずいたところと直し方も残します。

手順の正本は sekkeikai-opu の [docs/production-setup.md](https://github.com/sekkeikai/sekkeikai-opu/blob/main/docs/production-setup.md) と [Issue #7](https://github.com/sekkeikai/sekkeikai-opu/issues/7) です。この記事は、2026-10-27 に実際にやったことと、そのときの画面に合わせた補足です。

## 全体の形

```
部員のブラウザ
  │  https://sekkeikai-opu.sekkeikai.workers.dev/admin/  （編集画面 = Sveltia CMS）
  │
  │  「Sign in with GitHub」
  ▼
ログイン用の Worker（sveltia-cms-auth）
  │  https://sveltia-cms-auth.sekkeikai.workers.dev
  ▼
GitHub の OAuth App「設計会 編集画面」
  │  ログインを確かめ、トークンを返す
  ▼
編集画面から sekkeikai/sekkeikai-opu に直接コミット → Cloudflare が自動でビルド・公開
```

| もの | 場所 | 役割 |
|---|---|---|
| サイトの Worker | Cloudflare の `sekkeikai-opu` | `dist/` の静的ファイルを配信する |
| ログイン用の Worker | Cloudflare の `sveltia-cms-auth`（コードは private の `sekkeikai/sveltia-cms-auth`） | 編集画面と GitHub の間で、ログインの受け渡しをする |
| OAuth App | GitHub の組織 sekkeikai の Settings → Developer settings → OAuth Apps | 「設計会 編集画面」としてログインを許可する |

## 1. Cloudflare と GitHub をつなぐ

- Cloudflare の GitHub アプリは、**「Only select repositories」（特定のリポジトリだけ）**で入れた。選んだのは `sekkeikai/sekkeikai-opu` だけ。
  - 理由：必要な分だけ権限を渡すほうが安全。代替わりしても、何がつながっているかがすぐわかる。
  - あとから足すときは、GitHub の組織の Settings → GitHub Apps → Cloudflare → Configure。

## 2. サイト（sekkeikai-opu）の Worker を作る

Workers & Pages →「Import a repository」→ `sekkeikai/sekkeikai-opu`。

| 項目 | 入れたもの |
|---|---|
| Project name | `sekkeikai-opu`（`wrangler.jsonc` の `name` と同じ） |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Preview command | `npx wrangler preview`（画面の初期値のまま） |
| Enable Preview builds | オン（PR ごとに確認用の URL ができる） |
| Protect with Cloudflare Access | オフ（リポジトリが public なので、PR の中身はもともと誰でも見られる） |

Settings → Domains & Routes の 2 つのトグルは、どちらも**オン**にした。

| トグル | アドレス | 理由 |
|---|---|---|
| Production | `https://sekkeikai-opu.sekkeikai.workers.dev` | 独自ドメインがまだないので、サイトを見る方法はこれだけ |
| Preview | `*-sekkeikai-opu.sekkeikai.workers.dev` | PR ごとの確認用ページ。オフだとビルドは走っても開けない |

> 手順書と Issue #7 では、プレビューのコマンドが `npx wrangler versions upload` になっている。これは Cloudflare の画面が新しくなる前の書き方。今の初期値は `npx wrangler preview` で、`versions upload` にすると新しい「Preview」ではなく古い「Version URL」になる（[Cloudflare のドキュメント](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/)）。

## 3. ログイン用の Worker（sveltia-cms-auth）を作る

[sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) の README の「Deploy to Cloudflare Workers」ボタンを押すと、組織にコピーのリポジトリが作られ、Cloudflare につながる。

| 項目 | 入れたもの |
|---|---|
| Git account | sekkeikai（組織。個人のアカウントにすると引き継げない） |
| Create private Git repository | オン |
| Project name | `sveltia-cms-auth` |
| Build command | 空のまま |
| Deploy command | `pnpm run deploy`（中身は `wrangler deploy`） |
| Preview command | そのまま。Preview builds はオフ |

デプロイされた Worker の URL は `https://sveltia-cms-auth.sekkeikai.workers.dev`。トップを開くと **404 になるが、これは正常**。この Worker が応えるのは `/auth` と `/callback` だけで、ほかの URL には空の 404 を返す作りになっている。

## 4. GitHub の OAuth App を作る

組織 sekkeikai の Settings → Developer settings → OAuth Apps →「New OAuth App」。

| 項目 | 入れたもの |
|---|---|
| Application name | `設計会 編集画面` |
| Homepage URL | `https://sekkeikai-opu.sekkeikai.workers.dev` |
| Application description | 日本語の説明（ログインのとき部員が見る） |
| Redirect URI | `https://sveltia-cms-auth.sekkeikai.workers.dev/callback`（1 つだけ） |
| Allow wildcard matching | オフ |
| Enable Device Flow | オフ |
| Expire user access tokens | オフ（sveltia-cms-auth は期限切れのトークンを新しくする仕組みを持っていないため） |

作ったあと「Generate a new client secret」を押す。Client Secret は一度しか表示されないので、そのまま Cloudflare に入れる（チャットやメモには貼らない）。

## 5. ログイン用の Worker に値を入れる

Cloudflare の `sveltia-cms-auth` → **Settings → Variables and Secrets**（Worker が動くとき用）。環境は **Production だけ**、種類は **Secret**。

| 名前 | 値 |
|---|---|
| `GITHUB_CLIENT_ID` | OAuth App の Client ID |
| `GITHUB_CLIENT_SECRET` | OAuth App の Client Secret |
| `ALLOWED_DOMAINS` | `sekkeikai-opu.sekkeikai.workers.dev` |

- 秘密でない 2 つも Secret にしたのは、画面で「Text」として入れた値が、次の `wrangler deploy` で消えることがあるため（Secret は消えない）。
- Secret は入れたあと画面で値を見られない。`GITHUB_CLIENT_ID` は OAuth App のページで、`ALLOWED_DOMAINS` はこの記事で確かめられる。
- `ALLOWED_DOMAINS` が本番のアドレスだけなので、PR の確認用ページからは編集画面にログインできない。独自ドメインをつないだら、そのドメインを足す。

## 6. 編集画面にログイン用の Worker を教える

sekkeikai-opu の `public/admin/config.yml` に、`base_url: https://sveltia-cms-auth.sekkeikai.workers.dev` を書いた（[PR #8](https://github.com/sekkeikai/sekkeikai-opu/pull/8)、マージ済み）。

## つまずいたところと直し方

### ログイン用の Worker のビルドが `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` で止まる

```
ERR_PNPM_LOCKFILE_CONFIG_MISMATCH  Cannot proceed with the frozen installation. The current "overrides" configuration doesn't match the value found in the lockfile
```

- **原因**：sveltia-cms-auth は 2026-10-26 の更新で、`pnpm-workspace.yaml` に `overrides` を足した。Cloudflare の初期の pnpm（10.4 以前）は、`overrides` を `package.json` からしか読まないため、lockfile と合わないと判断して止まる。作者は 10-20 に同じエラーをいったん直していた（[Issue #17](https://github.com/sveltia/sveltia-cms-auth/issues/17)）。
- **直し方**：Cloudflare の `sveltia-cms-auth` → **Settings → Build → Variables and secrets**（ビルド用）に、`PNPM_VERSION` = `12.15.0` を **Text** で入れた。
- 組織のリポジトリは元のリポジトリのコピーなので、作者が直しても自動では反映されない。README の先頭に、この変数が必要なことと理由を書いた。

### 最初のビルドを Retry できない

```
Cannot retry a build that was created with a seed_repo override
```

- 「Deploy to Cloudflare」ボタンで作られた最初のビルドだけは、Retry できない。
- **直し方**：組織のリポジトリにコミットを 1 つ push すると、新しいビルドが走る。今回は、上の README のメモを足すコミットをきっかけにした。失敗した最初のビルドの記録は、一覧に残る。

### PR のプレビューのビルドだけが落ちる

```
✘ [ERROR] Your Wrangler configuration is missing a `previews` block to run this command.
```

- **原因**：`npx wrangler preview`（Worker Previews。2026-10 の時点では open beta）を使うには、`wrangler.jsonc` に `previews` の項目が必要。
- **直し方**：`wrangler.jsonc` に `"previews": {}` を足した（中身は空でよい）。PR #8 に一緒に入れて、プレビューのビルドが通ることを確かめた。
- GitHub のチェック（`check-and-build`）は通っていたので、サイトのコードの問題ではなかった。

### ログインで「OAuth app client ID or secret is not configured.」が出る

- **原因**：`GITHUB_CLIENT_ID` などを、**ビルド用**の場所（Settings → Build → Variables and secrets）に入れていた。ビルド用の値は、Worker が動くときには読めない。
- **直し方**：**Settings → Variables and Secrets**（Worker が動くとき用）に、Production・Secret で入れ直した。ビルド用の場所に入れた Client Secret などは消す（`PNPM_VERSION` は残す）。

| 置き場所 | 使われるとき | ここに入れるもの |
|---|---|---|
| Settings → **Build** → Variables and secrets | ビルドのとき | `PNPM_VERSION` |
| Settings → **Variables and Secrets** | Worker が動くとき | `GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`ALLOWED_DOMAINS` |

## 残っていること

- [ ] 値を入れ直したあと、`/admin/` から GitHub でログインでき、編集画面から保存（コミット）できるかを確かめる
- [ ] sekkeikai-opu の `docs/production-setup.md` と Issue #7 を、今の画面に合わせて直す（プレビューのコマンドを `npx wrangler preview` にする、`"previews": {}` が要ることを書く）
- [ ] `wrangler.jsonc` に `"workers_dev": true` と `"preview_urls": true` を書いておく（ダッシュボードのトグルがデプロイで戻されないように）
- [ ] Issue #7 の手順 4・5 にチェックを入れ、サイトの URL をコメントする（OGP などの設定の PR につなげる）
- [ ] 部員に「共用のパソコンでは、編集画面からログアウトする」と伝える（トークンに期限がないため）
