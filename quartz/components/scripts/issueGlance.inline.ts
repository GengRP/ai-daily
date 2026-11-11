// 本期速览：滚动时高亮当前这条、前面的标为已读、更新进度条
function setupIssueGlance() {
  const box = document.querySelector(".issue-glance") as HTMLElement | null
  if (!box) return
  const links = [...box.querySelectorAll<HTMLAnchorElement>(".ig-list a[data-for]")]
  const heads = links.map((a) => document.getElementById(a.dataset.for!)).filter(Boolean) as HTMLElement[]
  const bar = box.querySelector<HTMLElement>(".ig-progress-bar")
  const readEl = box.querySelector<HTMLElement>(".ig-read")
  let ticking = false
  const update = () => {
    ticking = false
    const line = window.innerHeight * 0.4
    let cur = -1
    heads.forEach((h, i) => {
      if (h.getBoundingClientRect().top < line) cur = i
    })
    const atEnd = window.innerHeight + window.scrollY >= document.body.scrollHeight - 4
    if (atEnd) cur = heads.length - 1
    links.forEach((a, i) => {
      a.parentElement!.classList.toggle("is-current", i === cur)
      a.parentElement!.classList.toggle("is-read", i < cur || (atEnd && i <= cur))
    })
    const read = atEnd ? heads.length : Math.max(cur, 0)
    if (readEl) readEl.textContent = String(read)
    if (bar) bar.style.setProperty("--p", String(read / Math.max(heads.length, 1)))
  }
  const onScroll = () => {
    if (!ticking) {
      ticking = true
      requestAnimationFrame(update)
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true })
  window.addCleanup(() => window.removeEventListener("scroll", onScroll))
  update()
}
document.addEventListener("nav", setupIssueGlance)
