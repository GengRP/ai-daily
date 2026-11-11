// 首页 / 各语言首页：传统挂历。一次显示一个月，左右翻页；有日报的日子可以点进去。
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative } from "../util/path"
import style from "./styles/dailyCalendar.scss"
import { entitiesOf } from "./IssueGlance"
// @ts-ignore
import script from "./scripts/dailyCalendar.inline"

type Lang = "cn" | "jp" | "en"
const WEEK: Record<Lang, string[]> = {
  cn: ["日", "一", "二", "三", "四", "五", "六"],
  jp: ["日", "月", "火", "水", "木", "金", "土"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
}
const MONTH_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
// 日本の和風月名
const WAFU = ["睦月", "如月", "弥生", "卯月", "皐月", "水無月", "文月", "葉月", "長月", "神無月", "霜月", "師走"]
const CN_NUM = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"]
const UI: Record<Lang, { prev: string; next: string; items: (n: number) => string; today: string }> = {
  cn: { prev: "上个月", next: "下个月", items: (n) => `${n} 条`, today: "今天" },
  jp: { prev: "前の月", next: "次の月", items: (n) => `${n}本`, today: "今日" },
  en: { prev: "Previous month", next: "Next month", items: (n) => `${n}`, today: "Today" },
}

export default (() => {
  const DailyCalendar: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
    const slug = fileData.slug ?? ""
    const m = slug.match(/^(?:(cn|jp|en)\/)?index$/)
    if (!m) return null
    const lang = (m[1] ?? "jp") as Lang

    // 这一语言所有日报：日期 → {条数, 第一条标题}
    const issues = new Map<string, { n: number; who: string[]; slug: string }>()
    for (const f of allFiles) {
      const s = f.slug ?? ""
      const d = s.match(new RegExp(`^${lang}/(\\d{4}-\\d{2}-\\d{2})$`))
      if (!d) continue
      const toc = (f.toc ?? []).filter((t) => t.depth >= 0)
      issues.set(d[1], { n: toc.length, who: [...new Set(toc.flatMap((t) => entitiesOf(t.text, lang)))], slug: s })
    }
    if (!issues.size) return null

    const dates = [...issues.keys()].sort()
    const [y0, m0] = dates[0].split("-").map(Number)
    const [y1, m1] = dates[dates.length - 1].split("-").map(Number)
    const months: [number, number][] = []
    for (let y = y0, mo = m0; y < y1 || (y === y1 && mo <= m1); mo === 12 ? ((y += 1), (mo = 1)) : (mo += 1)) {
      months.push([y, mo])
    }
    const latest = months.length - 1

    return (
      <section class="daily-calendar" data-lang={lang} aria-label="calendar">
        <div class="dc-hanger" aria-hidden="true">
          <span />
          <span />
        </div>
        {months.map(([y, mo], i) => {
          const first = new Date(Date.UTC(y, mo - 1, 1)).getUTCDay()
          const total = new Date(Date.UTC(y, mo, 0)).getUTCDate()
          const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: total }, (_, k) => k + 1)]
          while (cells.length % 7) cells.push(null)
          const count = [...issues.keys()].filter((d) => d.startsWith(`${y}-${String(mo).padStart(2, "0")}`)).length
          return (
            <div class="dc-page" data-month={`${y}-${String(mo).padStart(2, "0")}`} hidden={i !== latest}>
              <header class="dc-head">
                <button type="button" class="dc-flip dc-prev" aria-label={UI[lang].prev} disabled={i === 0}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <div class="dc-title">
                  <span class="dc-month">{mo}</span>
                  <span class="dc-label">
                    <span class="dc-name">{lang === "jp" ? WAFU[mo - 1] : lang === "cn" ? `${CN_NUM[mo - 1]}月` : MONTH_EN[mo - 1]}</span>
                    <span class="dc-year">{lang === "cn" ? `${y}年 · 共 ${count} 期` : lang === "jp" ? `${y}年 · ${count}号` : `${y} · ${count} issues`}</span>
                  </span>
                </div>
                <button type="button" class="dc-flip dc-next" aria-label={UI[lang].next} disabled={i === latest}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </header>
              <div class="dc-grid" role="grid">
                {WEEK[lang].map((w, k) => (
                  <div class={`dc-wd ${k === 0 ? "sun" : k === 6 ? "sat" : ""}`} role="columnheader">
                    {w}
                  </div>
                ))}
                {cells.map((day, k) => {
                  if (day === null) return <div class="dc-cell empty" />
                  const key = `${y}-${String(mo).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                  const it = issues.get(key)
                  const wd = k % 7
                  const cls = `dc-cell ${wd === 0 ? "sun" : wd === 6 ? "sat" : ""}`
                  if (!it) {
                    return (
                      <div class={`${cls} none`} data-date={key}>
                        <span class="dc-day">{day}</span>
                      </div>
                    )
                  }
                  return (
                    <a class={`${cls} has internal`} data-date={key} href={resolveRelative(slug as FullSlug, it.slug as FullSlug)} title={it.who.join(" · ")}>
                      <span class="dc-day">{day}</span>
                      <span class="dc-n">{UI[lang].items(it.n)}</span>
                      <span class="dc-who">
                        {it.who.slice(0, 3).map((w) => (
                          <span>{w}</span>
                        ))}
                        {it.who.length > 3 && <span class="dc-more">+{it.who.length - 3}</span>}
                      </span>
                    </a>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>
    )
  }
  DailyCalendar.css = style
  DailyCalendar.afterDOMLoaded = script
  return DailyCalendar
}) satisfies QuartzComponentConstructor
