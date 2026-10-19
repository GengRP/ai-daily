import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    links: {
      "KOUHEI AI": "https://gengrp.github.io/",
      "X @SuperKOUHEi001": "https://x.com/SuperKOUHEi001",
      "AI 入门实践指南": "https://github.com/GengRP/ai-starter-guide",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.MobileOnly(Component.HomeLink()),
    // 苹果风：去掉面包屑和标签，标题下面直接是正文
    Component.ArticleTitle(),
    Component.ContentMeta(),
  ],
  left: [
    Component.DesktopOnly(Component.HomeLink()),
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.Explorer({
      title: "",
      folderDefaultState: "open",
      useSavedState: false,
      // 只显示当前语言的日期；首页 index 属于日语版。函数在浏览器里运行，所以可以读 body 的 slug。
      filterFn: (node) => {
        const seg = (document.body.dataset.slug || "index").split("/")[0]
        const lang = seg === "cn" || seg === "en" ? seg : "jp"
        const top = node.slug.split("/")[0]
        return node.slugSegment !== "tags" && top === lang
      },
      // 文件只显示日期（文件名），不显示「AI 日报 …」整个标题
      mapFn: (node) => {
        if (!node.isFolder && node.slugSegment) node.displayName = node.slugSegment
      },
      // 新的日期在上面
      sortFn: (a, b) => b.displayName.localeCompare(a.displayName, undefined, { numeric: true }),
    }),
  ],
  // 关系图和反向链接（只会列出其他语言版本）去掉，只留本页目录
  right: [Component.DesktopOnly(Component.TableOfContents())],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.MobileOnly(Component.HomeLink()), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.DesktopOnly(Component.HomeLink()),
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer({
      title: "",
      folderDefaultState: "open",
      useSavedState: false,
      // 只显示当前语言的日期；首页 index 属于日语版。函数在浏览器里运行，所以可以读 body 的 slug。
      filterFn: (node) => {
        const seg = (document.body.dataset.slug || "index").split("/")[0]
        const lang = seg === "cn" || seg === "en" ? seg : "jp"
        const top = node.slug.split("/")[0]
        return node.slugSegment !== "tags" && top === lang
      },
      // 文件只显示日期（文件名），不显示「AI 日报 …」整个标题
      mapFn: (node) => {
        if (!node.isFolder && node.slugSegment) node.displayName = node.slugSegment
      },
      // 新的日期在上面
      sortFn: (a, b) => b.displayName.localeCompare(a.displayName, undefined, { numeric: true }),
    }),
  ],
  right: [],
}
