# How to Add a New Pack

A **pack** is a bundle of items shown by a module. Adding one is two steps:
create the pack file, then register it in the module's `catalog.json`.

## 1. Create the pack file

Add `my-pack.pack.json` in the target module's `content/` folder:

```json
{
  "id": "my-pack",
  "title": { "ar": "حزمتي", "en": "My Pack" },
  "thumbnail": { "type": "emoji", "value": "📦" },
  "languages": ["ar", "en"],
  "license": { "type": "original" },
  "version": 1,
  "categories": [
    { "id": "cat-a", "title": { "ar": "المجموعة أ" }, "icon": "⭐", "packId": "my-pack", "order": 1 }
  ],
  "items": [
    {
      "id": "my-item-1",
      "assetType": "activity",
      "title": { "ar": "عنصري الأول" },
      "categoryId": "cat-a",
      "ageGroup": "child",
      "difficulty": "easy",
      "thumbnail": { "type": "emoji", "value": "🎯" },
      "data": { "type": "pattern-completion",
                "params": { "sequence": ["🔴","🔵"], "options": ["🔴","🔵"], "answer": "🔴" } }
    }
  ]
}
```

Use the `assetType` and `data`/`asset` shape that the module understands (see the
type-specific how-tos). All items in a pack don't have to be the same type.

## 2. Register it in the catalog

Add a descriptor to the module's `content/catalog.json` `packs[]`:

```json
{
  "id": "my-pack",
  "title": { "ar": "حزمتي", "en": "My Pack" },
  "url": "my-pack.pack.json",
  "thumbnail": { "type": "emoji", "value": "📦" },
  "languages": ["ar", "en"],
  "order": 2
}
```

`url` is relative to the catalog's folder.

## 3. Load it

If the example/host page loads a single pack by id, either add your pack id to
what it loads, or load multiple packs:

```js
await content.init({ catalog: 'catalog.json' });
await content.loadPack('activities');   // existing
await content.loadPack('my-pack');      // your new pack
```

Items from every loaded pack are merged and become available to the module's
filters and search.

## 4. Validate & deploy

```bash
python3 -c "import json; json.load(open('my-pack.pack.json')); print('OK')"
python3 -c "import json; json.load(open('catalog.json')); print('OK')"
```

Re-deploy the folder and hard-refresh. Done — no code changes required.

## Tips

- Keep pack `id`s and item `id`s globally unique.
- Reuse existing art with relative paths (`"src": "../../coloring/content/art/lion.svg"`).
- Give each pack a distinct `order` so its position in menus is predictable.
