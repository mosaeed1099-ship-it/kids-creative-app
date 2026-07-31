# Kids Creative Studio — Documentation (v1.0.0)

Welcome to the documentation for **Kids Creative Studio**, a fully offline,
static, no-build children's creative & educational web app built on native ES
modules with **zero dependencies**.

## Guides

| Audience | Document |
|----------|----------|
| Parents / teachers using the app | [User Guide](USER_GUIDE.md) |
| Whoever deploys & maintains it | [Administrator Guide](ADMIN_GUIDE.md) |
| Engineers extending it | [Developer Guide](DEVELOPER_GUIDE.md) |
| Everyone | [Folder Structure Guide](FOLDER_STRUCTURE.md) |

## Content creation

Start with the [Content Creation Guide](CONTENT_CREATION_GUIDE.md), then the
task-specific how-tos:

- [How to Add New Packs](ADD_PACKS.md)
- [How to Add New Activities](ADD_ACTIVITIES.md)
- [How to Add New Coloring Pages](ADD_COLORING_PAGES.md)
- [How to Add New Characters](ADD_CHARACTERS.md)
- [How to Add New PDFs / Printables](ADD_PDFS.md)

## Release engineering

- [Release Checklist](RELEASE_CHECKLIST.md)
- [QA Audit Report](QA_AUDIT.md)
- [Offline Validation Report](OFFLINE_VALIDATION.md)
- [Accessibility Report](ACCESSIBILITY.md)
- [Performance Report](PERFORMANCE.md)

## At a glance

- **No backend, no database, no cloud, no AI, no external APIs.** Everything
  runs in the browser and works with **no Internet connection**.
- **No build step required.** Native ES modules + dynamic `import()`. Deploy the
  folder as-is to Cloudflare Pages, GitHub Pages, or Netlify at zero cost.
- **Arabic-first (RTL)** UI across every module.
- Version **1.0.0** — see [CHANGELOG](../CHANGELOG.md).
