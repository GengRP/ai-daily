import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

// Link back to the personal homepage (gengrp.github.io), matched to the page's language folder.
const HOME = "https://gengrp.github.io"
const targets: Record<string, { href: string; label: string }> = {
  cn: { href: `${HOME}/`, label: "← 返回个人主页" },
  jp: { href: `${HOME}/ja/`, label: "← ホームへ戻る" },
  en: { href: `${HOME}/en/`, label: "← Back to homepage" },
}

const HomeLink: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const top = (fileData.slug ?? "").split("/")[0]
  const t = targets[top] ?? targets.jp
  return (
    <a class={classNames(displayClass, "home-link")} href={t.href}>
      {t.label}
    </a>
  )
}

HomeLink.css = `
.home-link {
  display: inline-block;
  font-size: 0.9rem;
  color: var(--darkgray);
  padding: 0.5rem 0;
  min-height: 44px;
  line-height: 28px;
}
.home-link:hover {
  color: var(--secondary);
}
`

export default (() => HomeLink) satisfies QuartzComponentConstructor
