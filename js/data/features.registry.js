/**
 * features.registry.js — THE single source of truth for feature modules.
 *
 * To add a new feature to the whole product you only:
 *   1) create js/modules/<folder>/<Name>Module.js (extends core/Module)
 *   2) add one entry here
 * The dashboard, router and lazy-loader all read from this list, so no other
 * file needs to change. `path` is relative to js/modules/.
 */
export const FEATURES = [
  {
    id: 'coloring',
    title: 'التلوين',
    icon: '🎨',
    route: '/coloring',
    path: 'coloring/ColoringModule.js',
    description: 'لوّن الرسمات بالنقر، أضف إكسسوارات، واحفظ أعمالك.',
    color: '#ff6b9d',
    enabled: true,
  },
  {
    id: 'draw',
    title: 'الرسم الحر',
    icon: '✏️',
    route: '/draw',
    path: 'free-draw/FreeDrawModule.js',
    description: 'ارسم بنفسك بالفرشاة والألوان على لوحة فاضية.',
    color: '#5b6bff',
    enabled: true,
  },
  {
    id: 'trace',
    title: 'ارسم وقلّد',
    icon: '🖼️',
    route: '/trace',
    path: 'trace/TraceModule.js',
    description: 'قلّد نموذجًا يظهر خفيفًا خلف اللوحة وتمشّى عليه.',
    color: '#57c98a',
    enabled: true,
  },
  {
    id: 'stickers',
    title: 'الملصقات',
    icon: '⭐',
    route: '/stickers',
    path: 'stickers/StickersModule.js',
    description: 'ألصق شخصيات وأشكال على لوحاتك.',
    color: '#ffb02e',
    enabled: true,
  },
  {
    id: 'puzzles',
    title: 'الألغاز',
    icon: '🧩',
    route: '/puzzles',
    path: 'puzzles/PuzzlesModule.js',
    description: 'ركّب القطع وكوّن الصورة.',
    color: '#b06bff',
    enabled: true,
  },
  {
    id: 'story',
    title: 'قصتي',
    icon: '📖',
    route: '/story',
    path: 'story/StoryModule.js',
    description: 'كوّن قصة بالصور والكلمات.',
    color: '#35b0ff',
    enabled: true,
  },
];

/** Only the features that are switched on. */
export const enabledFeatures = () => FEATURES.filter((f) => f.enabled);

export default FEATURES;
