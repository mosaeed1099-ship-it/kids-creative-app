/**
 * logger.js — thin logging wrapper that can be silenced in production
 * via APP_CONFIG.debug. Prefixes messages so logs are easy to filter.
 */
import { APP_CONFIG } from '../config/app.config.js';

const PREFIX = '[KCS]';

function enabled() {
  return !!APP_CONFIG.debug;
}

export const logger = {
  log: (...a) => { if (enabled()) console.log(PREFIX, ...a); },
  info: (...a) => { if (enabled()) console.info(PREFIX, ...a); },
  warn: (...a) => console.warn(PREFIX, ...a),
  error: (...a) => console.error(PREFIX, ...a),
};

export default logger;
