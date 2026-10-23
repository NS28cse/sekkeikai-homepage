// 「設計を知る」のデータ（src/content/design/）から、工程と視点を取り出す。
// 工程の名前は「設計のプロセス」のページの章（step を書いた章）が正本。地図や視点のページはここから読む。
// ページ（YAML）を足すだけで、一覧・地図・リンクに自動で加わるようにしている。
import { getCollection, getEntry } from "astro:content";
import type { CollectionEntry } from "astro:content";

export interface ProcessStep {
  // 1 から始まる工程の番号
  n: number;
  // ページ内の行き先（例: step-2）。/design/process/#step-2 のように使う
  id: string;
  title: string;
  sub: string;
}

export async function getProcessSteps(): Promise<ProcessStep[]> {
  const process = await getEntry("design", "process");
  if (!process) return [];
  return process.data.chapters
    .filter((c) => c.step)
    .map((c, i) => ({ n: i + 1, id: `step-${i + 1}`, title: c.heading, sub: c.step ?? "" }));
}

// 指定した layer のページを order の順に
export async function getDesignPages(layer: "process" | "lens" | "topic"): Promise<CollectionEntry<"design">[]> {
  return (await getCollection("design", (e) => e.data.layer === layer)).sort((a, b) => a.data.order - b.data.order);
}

// 視点（lens）のページ。perStep を書いているのに工程の数と合わないときは、ビルドを止めて知らせる
export async function getLenses(): Promise<CollectionEntry<"design">[]> {
  const steps = await getProcessSteps();
  const lenses = await getDesignPages("lens");
  for (const l of lenses) {
    if (l.data.perStep && l.data.perStep.length !== steps.length) {
      throw new Error(
        `src/content/design/${l.id}.yaml の perStep は、工程の数（${steps.length}個）と同じ数だけ書いてください`,
      );
    }
  }
  return lenses;
}

// 一覧やリンクのカードに出す、階層の名前
export function layerLabel(page: CollectionEntry<"design">): string {
  if (page.data.layer === "process") return "設計のプロセス";
  if (page.data.layer === "lens") return `視点 ${page.data.order} / ${page.data.en}`;
  return `テーマ / ${page.data.en}`;
}
