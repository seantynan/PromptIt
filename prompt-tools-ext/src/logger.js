const LOG_LEVEL = 'debug'; // debug | info | warn | error | none

const LEVEL_PRIORITY = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

function shouldLog(level) {
  const currentLevel = LOG_LEVEL in LEVEL_PRIORITY ? LOG_LEVEL : 'warn';
  return LEVEL_PRIORITY[currentLevel] <= LEVEL_PRIORITY[level];
}

function logDebug(...args) {
  if (shouldLog('debug')) {
    console.debug(...args);
  }
}

function logInfo(...args) {
  if (shouldLog('info')) {
    console.info(...args);
  }
}

function logWarn(...args) {
  if (shouldLog('warn')) {
    console.warn(...args);
  }
}

function logError(...args) {
  console.error(...args);
}
