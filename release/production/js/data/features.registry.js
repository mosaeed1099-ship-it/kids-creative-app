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
    path: 'sticker-studio/StickerStudioModule.js',
    description: 'ألصق شخصيات وأشكال على لوحاتك.',
    color: '#ffb02e',
    enabled: true,
  },
  {
    id: 'puzzles',
    title: 'الألغاز',
    icon: '🧩',
    route: '/puzzles',
    path: 'puzzle-studio/PuzzleStudioModule.js',
    description: 'ركّب القطع وكوّن الصورة.',
    color: '#b06bff',
    enabled: true,
  },
  {
    id: 'story',
    title: 'قصتي',
    icon: '📖',
    route: '/story',
    path: 'story-creator/StoryCreatorModule.js',
    description: 'كوّن قصة بالصور والكلمات.',
    color: '#35b0ff',
    enabled: true,
  },
  {
    id: 'learning',
    title: 'أنشطة',
    icon: '🧠',
    route: '/learning',
    path: 'learning-activities/LearningModule.js',
    description: 'ألعاب وأنشطة تعليمية: حروف وأرقام وأشكال ومتاهات.',
    color: '#57c98a',
    enabled: true,
  },
  {
    id: 'create',
    title: 'إبداع',
    icon: '🧑‍🎨',
    route: '/create',
    path: 'creative-studio/CreativeStudioModule.js',
    description: 'ركّب شخصية وزيّنها بالملصقات والألوان.',
    color: '#ff8a5b',
    enabled: true,
  },
  {
    id: 'print',
    title: 'الطباعة',
    icon: '🖨️',
    route: '/print',
    path: 'print-center/PrintCenterModule.js',
    description: 'اطبع الرسمات وصفحات التلوين وأعمالك.',
    color: '#8a92a6',
    enabled: true,
  },
  {
    id: 'admin',
    title: 'إدارة المحتوى',
    icon: '🗂️',
    route: '/admin',
    path: 'admin-cms/AdminCMSModule.js',
    description: 'محرّر المحتوى لإنشاء بيانات المشروع (يعمل دون إنترنت).',
    color: '#6b7280',
    enabled: false,
  },
  {
    id: 'parents',
    title: 'لوحة الأهل',
    icon: '👪',
    route: '/parents',
    path: 'parent-dashboard/ParentModule.js',
    description: 'متابعة تقدّم الأطفال وإدارة الملفات (يُفتح من #/parents).',
    color: '#b06bff',
    enabled: false,
  },
];

/** Only the features that are switched on. */
export const enabledFeatures = () => FEATURES.filter((f) => f.enabled);

export default FEATURES;
