# Story Creator (`js/modules/story-creator/`) — Phase 16

A production-quality, offline multi-page story-book editor that **replaces the
`/story` placeholder**. Additive: every file lives under this folder and it
consumes **only public APIs** of the Canvas Engine, Content Engine, **Sticker
Studio** and **Free Draw Studio**. The only wiring change is one line in
`js/data/features.registry.js` pointing `/story` at `StoryCreatorModule.js`.

## Reuse (no duplicated logic)

| Need | Reused from |
|---|---|
| Render / camera / input / export | Canvas Engine (`js/engine`) |
| Sticker library (packs/search/favorites) | Content Engine + Sticker Studio `data/` |
| Sticker objects | Sticker Studio `StickerObject` + `stickerVisual` |
| Drawing (bitmap + vector marks + brushes) | Free Draw Studio `RasterLayer` + `strokeRenderer` |
| Shapes | Free Draw Studio `paintShape` + `SHAPES` |

Only module-owned code: the Story model, the text/image objects, the object
transform tool, the offline PDF encoder, and an *uncapped* history.

## Model

```
Story { meta{title, author, childName, date, category}, coverIndex, pages[] }
Page  { bgColor, bgImage, thumb, objects[] }
object.type ∈ text | image | shape | sticker | draw
```
Unlimited **story books** and **pages**; each page: add / delete / reorder /
duplicate. The cover page shows the metadata via a `CoverObject`.

## Per-page features

- **Text** — content, font family/size, bold/italic/underline, alignment,
  RTL/LTR, emoji; edited in a dialog, previewed live, one undo step.
- **Image** — import local file (auto-downscaled), resize/rotate/flip, **crop**
  (drag a rectangle), layer order.
- **Sticker** — pick from the reused Sticker Studio library.
- **Shape** — the nine Free Draw shapes with fill/stroke colours.
- **Drawing** — brush on a per-page doodle layer (pencil/brush/crayon/marker).
- **Background** — colour and/or cover-fit image.

Every object: select / move / resize / rotate / flip / duplicate / delete /
layer order, with unlimited undo/redo.

## Story features & export

- **Info** — title, author, child name, date, category (shown on the cover).
- **Save locally** (named library with cover thumbnails) + **autosave** +
  **continue editing** (localStorage).
- **Export** — current page **PNG**/**JPEG**, whole book **PDF** (a tiny offline
  DCTDecode encoder in `io/pdf.js`), and **Print** (all pages).

Fully offline · RTL · high-DPI · responsive · tablet-optimised · light/dark.

## Files

```
StoryCreatorModule.js  StoryCreatorApp.js  index.js  example.html  README.md
model/Story.js
scene/ StoryObject.js  TextObject.js  ImageObject.js  ShapeObject.js
       DrawObject.js  BackgroundObject.js  CoverObject.js  factory.js
interaction/ ObjectTool.js  DrawTool.js
history/ History.js  commands.js
io/ Storage.js  imageImport.js  bgImage.js  exportImage.js  pdf.js
ui/ StoryUI.js  TopBar.js  Toolbar.js  Filmstrip.js  Inspector.js
    TextEditor.js  helpers.js
styles/ story-creator.css
```
