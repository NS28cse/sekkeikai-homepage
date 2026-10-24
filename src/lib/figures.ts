// 図（src/components/figures/）の名前の一覧。
// 文章（YAML）の「type: figure」の name にはここにある名前だけを書ける。ほかの名前を書くとビルドが止まる。
// 図を足すときは：figures/ にコンポーネントを作る → ここに名前を足す → src/components/Figure.astro に登録する
export const figureNames = [
  "design-process",
  "cost-escalation",
  "double-diamond",
  "requirements-layers",
  "v-model",
  "kano-model",
  "kj-method",
  "abstraction-ladder",
  "beam-calculator",
  "fitts-demo",
  "gulfs",
  "hcd-cycle",
  "anscombe",
  "analysis-cycle",
  "pareto-front",
  "ahp-example",
  "door-signifier",
] as const;

export type FigureName = (typeof figureNames)[number];
