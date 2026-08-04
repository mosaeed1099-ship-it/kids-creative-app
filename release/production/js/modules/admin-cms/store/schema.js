/**
 * schema.js — the ordered list of CMS sections. Each section is an editor config
 * (imported from its own file). The generic ListView + EntityForm consume these,
 * so adding a section = adding one editor file + one line here.
 */
import Packs from '../editors/PackEditor.js';
import Coloring from '../editors/ColoringEditor.js';
import Stickers from '../editors/StickerEditor.js';
import Puzzles from '../editors/PuzzleImageEditor.js';
import Stories from '../editors/StoryEditor.js';
import Activities from '../editors/ActivityEditor.js';
import Pdfs from '../editors/PdfEditor.js';
import Categories from '../editors/CategoryEditor.js';
import Assets from '../editors/AssetEditor.js';

export const SECTIONS = [Packs, Coloring, Stickers, Puzzles, Stories, Activities, Pdfs, Categories, Assets];
export const sectionById = (id) => SECTIONS.find((s) => s.id === id) || SECTIONS[0];
