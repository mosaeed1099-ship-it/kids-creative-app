/**
 * index.js — public barrel for the Admin CMS module.
 */
import AdminCMSModule from './AdminCMSModule.js';

export default AdminCMSModule;
export { AdminCMSModule };
export { default as AdminCMSApp } from './AdminCMSApp.js';
export { default as CmsStore } from './store/CmsStore.js';
export { SECTIONS } from './store/schema.js';
export * as generators from './generate/generators.js';
