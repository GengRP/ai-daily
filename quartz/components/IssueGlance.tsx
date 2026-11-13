// 「本期速览」：替代右侧目录。不重复正文标题，只给正文没有的信息：
// 本期几条、各是什么类型（分类色条）、每条的主角和来源、阅读进度、上一期/下一期。
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative } from "../util/path"
import { classNames } from "../util/lang"
import style from "./styles/issueGlance.scss"
// @ts-ignore
import script from "./scripts/issueGlance.inline"

type Lang = "cn" | "jp" | "en"
type Cat = "robot" | "security" | "law" | "research" | "model" | "product" | "other"

const CAT_ORDER: Cat[] = ["product", "model", "research", "security", "law", "robot", "other"]
const CAT_LABEL: Record<Lang, Record<Cat, string>> = {
  cn: { product: "产品", model: "模型", research: "研究", security: "安全", law: "监管与诉讼", robot: "机器人", other: "其他" },
  jp: { product: "製品", model: "モデル", research: "研究", security: "セキュリティ", law: "規制・訴訟", robot: "ロボット", other: "その他" },
  en: { product: "Product", model: "Model", research: "Research", security: "Security", law: "Policy & law", robot: "Robotics", other: "Other" },
}
const UI: Record<Lang, { title: string; items: (n: number) => string; prev: string; next: string; read: string }> = {
  cn: { title: "本期速览", items: (n) => `${n} 条新闻`, prev: "上一期", next: "下一期", read: "已读" },
  jp: { title: "今日のまとめ", items: (n) => `ニュース ${n} 本`, prev: "前の号", next: "次の号", read: "既読" },
  en: { title: "At a glance", items: (n) => `${n} stories`, prev: "Previous", next: "Next", read: "Read" },
}
const WEEKDAY: Record<Lang, string[]> = {
  cn: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
  jp: ["日", "月", "火", "水", "木", "金", "土"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
}

// 分类：按标题关键词，从上往下第一个命中的算数
const RULES: [Cat, RegExp][] = [
  ["robot", /【机器人】|【ロボット】|\[Robotics\]|机器人|ロボット|robot/i],
  ["security", /隐私|审核员|プライバシー|レビュー担当|privacy|reviewers|入侵|泄露|漏洞|明文|未经授权|侵入|流出|平文|無断|弱点|breach|leak|plain text|without permission|weakness|vulnerab|hack/i],
  ["law", /诉讼|起诉|法官|草案|欧盟|罚|监管|提訴|訴訟|規制|罰金|EU |sue|class action|judge|regulat|fine|crack down|收紧|制限/i],
  ["research", /研究|论文|猜想|调查|論文|予想|調査|research|paper|conjecture|investigation|study/i],
  ["model", /模型|モデル|model|Gemini \d|Fable|Mythos|GPT-?\d|Llama|Muse/],
  ["product", /推出|上线|发布|应用|発表|提供開始|公開|launch|release|app|arrive/i],
]
const classify = (t: string): Cat => RULES.find(([, re]) => re.test(t))?.[0] ?? "other"

// 主角：常见公司/机构，找不到就用来源网站
const ENTITIES: [RegExp, string][] = [
  [/Anthropic/, "Anthropic"], [/OpenAI/, "OpenAI"], [/DeepMind/, "DeepMind"],
  [/谷歌|Google|Gemini/, "Google"], [/\bMeta\b/, "Meta"], [/微软|Microsoft/, "Microsoft"],
  [/英伟达|NVIDIA|Nvidia/, "NVIDIA"], [/苹果|Apple/, "Apple"], [/亚马逊|Amazon/, "Amazon"],
  [/DeepSeek/, "DeepSeek"], [/Notion/, "Notion"], [/xAI/, "xAI"], [/Mistral/, "Mistral"],
  [/Fireworks/, "Fireworks"], [/Cubist|Point72/, "Cubist"], [/Suno/, "Suno"],
  [/欧盟|\bEU\b/, "EU"], [/上海交|Shanghai Jiao/, "SJTU"], [/Nature Will/, "Nature Will"],
  [/Allen|AI2/, "Ai2"], [/美联航|United Airlines|ユナイテッド航空/, "United"],
  [/Spotify/, "Spotify"], [/Hermes/, "Hermes"], [/腾讯|テンセント|Tencent/, "Tencent"],
  [/三星|サムスン|Samsung/, "Samsung"], [/Agile Robots/, "Agile Robots"], [/\bAIE\b/, "AIE"], [/Edge0/, "Edge0"],
  [/llama\.cpp/, "llama.cpp"],
]
// 机构名按语言显示
const LOCAL: Record<string, Partial<Record<Lang, string>>> = {
  SJTU: { cn: "上海交大", jp: "上海交通大学" },
  EU: { cn: "欧盟" },
  United: { cn: "美联航", jp: "ユナイテッド航空" },
  Tencent: { cn: "腾讯" }, Samsung: { cn: "三星" },
}
// 一条标题里的主角（挂历页也用）
export const entitiesOf = (t: string, lang: Lang): string[] => {
  let hits = ENTITIES.filter(([re]) => re.test(t)).map(([, n]) => LOCAL[n]?.[lang] ?? n)
  if (!hits.length && /Claude/.test(t)) hits = ["Anthropic"]
  return [...new Set(hits)]
}
const entityOf = (t: string, lang: Lang, href?: string) => {
  const hits = entitiesOf(t, lang)
  const uniq = [...new Set(hits)].slice(0, 2)
  if (uniq.length) return uniq.join(" · ")
  return href ? domainOf(href) : ""
}
const domainOf = (href: string) => {
  try {
    return new URL(href).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}
const text = (n: any): string =>
  n.type === "text" ? n.value : (n.children ?? []).map(text).join("")

interface Options {
  variant: "full" | "compact"
}

export default ((opts?: Partial<Options>) => {
  const variant = opts?.variant ?? "compact"
  const IssueGlance: QuartzComponent = ({ fileData, tree, allFiles, displayClass }: QuartzComponentProps) => {
    const slug = fileData.slug ?? ""
    const m = slug.match(/^(cn|jp|en)\/(\d{4}-\d{2}-\d{2})$/)
    if (!m) return null
    const lang = m[1] as Lang
    const date = m[2]

    const items = ((tree as any).children ?? [])
      .filter((n: any) => n.type === "element" && n.tagName === "h3")
      .map((h: any) => {
        const a = (h.children ?? []).find((c: any) => c.tagName === "a" && c.properties?.href?.startsWith("http"))
        const title = text(h).trim()
        const href = a?.properties?.href as string | undefined
        return { id: h.properties?.id as string, cat: classify(title), who: entityOf(title, lang, href), src: href ? domainOf(href) : "" }
      })
    if (!items.length) return null

    const counts = CAT_ORDER.map((c) => [c, items.filter((i: any) => i.cat === c).length] as const).filter(([, n]) => n > 0)

    const days = allFiles
      .map((f) => f.slug ?? "")
      .filter((s) => new RegExp(`^${lang}/\\d{4}-\\d{2}-\\d{2}$`).test(s))
      .sort()
    const idx = days.indexOf(slug)
    const prev = idx > 0 ? days[idx - 1] : undefined
    const next = idx >= 0 && idx < days.length - 1 ? days[idx + 1] : undefined
    const d = new Date(date + "T00:00:00Z")
    const t = UI[lang]

    return (
      <nav class={classNames(displayClass, "issue-glance", `ig-${variant}`)} aria-label={t.title}>
        <header class="ig-head">
          <div class="ig-date">
            <span class="ig-md">{`${d.getUTCMonth() + 1}.${d.getUTCDate()}`}</span>
            <span class="ig-wd">{WEEKDAY[lang][d.getUTCDay()]}</span>
          </div>
          <div class="ig-sub">
            <span class="ig-title">{t.title}</span>
            <span class="ig-count">{t.items(items.length)}</span>
          </div>
        </header>

        {variant === "full" && (
          <div class="ig-mix">
            <div class="ig-bar" aria-hidden="true">
              {counts.map(([c, n]) => (
                <span class={`cat-${c}`} style={`flex:${n}`} />
              ))}
            </div>
            <ul class="ig-legend">
              {counts.map(([c, n]) => (
                <li class={`cat-${c}`}>
                  <i />
                  {CAT_LABEL[lang][c]} <b>{n}</b>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ol class="ig-list">
          {items.map((it: any, i: number) => (
            <li class={`cat-${it.cat}`}>
              <a href={`#${it.id}`} data-for={it.id}>
                <span class="ig-num">{String(i + 1).padStart(2, "0")}</span>
                <span class="ig-body">
                  <span class="ig-who">{it.who}</span>
                  {variant === "full" && <span class="ig-meta">{CAT_LABEL[lang][it.cat as Cat]}{it.src && it.src !== it.who ? ` · ${it.src}` : ""}</span>}
                </span>
              </a>
            </li>
          ))}
        </ol>

        <div class="ig-progress" aria-hidden="true">
          <span class="ig-progress-bar" />
          <span class="ig-progress-text">
            {t.read} <b class="ig-read">0</b>/{items.length}
          </span>
        </div>

        <footer class="ig-nav">
          {prev ? (
            <a class="internal" href={resolveRelative(slug as FullSlug, prev as FullSlug)}>
              ← {t.prev}
            </a>
          ) : (
            <span />
          )}
          {next ? (
            <a class="internal" href={resolveRelative(slug as FullSlug, next as FullSlug)}>
              {t.next} →
            </a>
          ) : (
            <span />
          )}
        </footer>
      </nav>
    )
  }
  IssueGlance.css = style
  IssueGlance.afterDOMLoaded = script
  return IssueGlance
}) satisfies QuartzComponentConstructor
