// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// 静的サイトとして dist/ に出力する（このリポジトリはプロトタイプ用。本番の配信設定は sekkeikai-opu にある）。
export default defineConfig({
  // 独自ドメインが決まったら site: "https://..." を設定する（OGP・サイトマップ用）
  trailingSlash: "always",
  vite: {
    plugins: [tailwindcss()],
  },
});
