/**
 * 日志工具类 - 提供统一的日志前缀和分级管理
 */
class Logger {
  constructor(module = 'WVE') {
    this.module = module;
    this.prefix = `[WVE:${module}]`;
    this.isEnabled = true;
  }

  /**
   * 设置日志启用状态
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  /**
   * 调试日志
   */
  debug(...args) {
    if (this.isEnabled) {
      console.debug(this.prefix, ...args);
    }
  }

  /**
   * 信息日志
   */
  info(...args) {
    if (this.isEnabled) {
      console.info(this.prefix, ...args);
    }
  }

  /**
   * 警告日志
   */
  warn(...args) {
    if (this.isEnabled) {
      console.warn(this.prefix, ...args);
    }
  }

  /**
   * 错误日志
   */
  error(...args) {
    if (this.isEnabled) {
      console.error(this.prefix, ...args);
    }
  }

  /**
   * 性能计时开始
   */
  time(label) {
    if (this.isEnabled) {
      console.time(`${this.prefix} ${label}`);
    }
  }

  /**
   * 性能计时结束
   */
  timeEnd(label) {
    if (this.isEnabled) {
      console.timeEnd(`${this.prefix} ${label}`);
    }
  }

  /**
   * 分组日志开始
   */
  group(label) {
    if (this.isEnabled) {
      console.group(`${this.prefix} ${label}`);
    }
  }

  /**
   * 分组日志结束
   */
  groupEnd() {
    if (this.isEnabled) {
      console.groupEnd();
    }
  }
}

// 创建全局日志管理器
window.WVE = window.WVE || {};
window.WVE.Logger = Logger;

// 创建默认日志器
window.WVE.logger = new Logger('MAIN');