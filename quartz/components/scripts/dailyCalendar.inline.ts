// 挂历：左右翻月；标出今天（东京时间）
function setupDailyCalendar() {
  const cal = document.querySelector(".daily-calendar") as HTMLElement | null
  if (!cal) return
  const pages = [...cal.querySelectorAll<HTMLElement>(".dc-page")]
  let cur = pages.findIndex((p) => !p.hidden)
  const show = (i: number) => {
    if (i < 0 || i >= pages.length) return
    pages[cur].hidden = true
    pages[i].hidden = false
    cur = i
  }
  const onClick = (e: Event) => {
    const btn = (e.target as HTMLElement).closest(".dc-flip") as HTMLButtonElement | null
    if (!btn || btn.disabled) return
    show(cur + (btn.classList.contains("dc-prev") ? -1 : 1))
  }
  const onKey = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).closest("input, textarea")) return
    if (e.key === "ArrowLeft") show(cur - 1)
    if (e.key === "ArrowRight") show(cur + 1)
  }
  cal.addEventListener("click", onClick)
  document.addEventListener("keydown", onKey)
  window.addCleanup(() => {
    cal.removeEventListener("click", onClick)
    document.removeEventListener("keydown", onKey)
  })
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date())
  cal.querySelector(`[data-date="${today}"]`)?.classList.add("today")
}
document.addEventListener("nav", setupDailyCalendar)
