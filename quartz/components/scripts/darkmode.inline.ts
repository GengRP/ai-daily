// 按本地时间自动切换：8:00–18:00 白天，其余黑夜。
// 手动点按钮只管到下一个切换点（存 theme-override，带过期时间）。主页用同一个 key，两边同步。
const DAY_START = 8
const DAY_END = 18

const autoTheme = (d = new Date()): "light" | "dark" => {
  const h = d.getHours()
  return h >= DAY_START && h < DAY_END ? "light" : "dark"
}

const nextBoundary = (d = new Date()) => {
  const n = new Date(d)
  n.setMinutes(0, 0, 0)
  const h = d.getHours()
  if (h < DAY_START) n.setHours(DAY_START)
  else if (h < DAY_END) n.setHours(DAY_END)
  else {
    n.setDate(n.getDate() + 1)
    n.setHours(DAY_START)
  }
  return n.getTime()
}

const resolveTheme = (): "light" | "dark" => {
  try {
    const o = JSON.parse(localStorage.getItem("theme-override") ?? "null")
    if (o && (o.theme === "light" || o.theme === "dark") && Date.now() < o.until) return o.theme
  } catch {}
  localStorage.removeItem("theme-override")
  return autoTheme()
}

localStorage.removeItem("theme") // 旧版会一直记住上次的选择，清掉
document.documentElement.setAttribute("saved-theme", resolveTheme())

const emitThemeChangeEvent = (theme: "light" | "dark") => {
  const event: CustomEventMap["themechange"] = new CustomEvent("themechange", {
    detail: { theme },
  })
  document.dispatchEvent(event)
}

const applyTheme = (theme: "light" | "dark") => {
  if (document.documentElement.getAttribute("saved-theme") === theme) return
  document.documentElement.setAttribute("saved-theme", theme)
  emitThemeChangeEvent(theme)
}

document.addEventListener("nav", () => {
  const switchTheme = () => {
    const newTheme =
      document.documentElement.getAttribute("saved-theme") === "dark" ? "light" : "dark"
    localStorage.setItem("theme-override", JSON.stringify({ theme: newTheme, until: nextBoundary() }))
    applyTheme(newTheme)
  }

  for (const darkmodeButton of document.getElementsByClassName("darkmode")) {
    darkmodeButton.addEventListener("click", switchTheme)
    window.addCleanup(() => darkmodeButton.removeEventListener("click", switchTheme))
  }

  // 页面开着的时候到点自动切
  const timer = setInterval(() => applyTheme(resolveTheme()), 60_000)
  window.addCleanup(() => clearInterval(timer))
})
