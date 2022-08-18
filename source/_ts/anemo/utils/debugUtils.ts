/**
 * 调试工具
 */
export default {
  /**
   * 在控制台打印一个信息（支持格式化输出）
   * @param messages 需要输出的字符串
   */
  info(...messages: unknown[]): void {
    /* IFDEBUG */
    if (messages.length === 0) {
      messages.push(''); // 避免显示 %s，下同
    }
    if (typeof messages[0] !== 'string') {
      messages.unshift(''); // 去除 %s，下同
    }
    console.log('%cINFO%c %s', 'color:green;', '', ...messages);
    //                    ^^ 这个 %s 是为了让 messages 中的字符串也能被格式化，下同
    /* FIDEBUG */
  },

  /**
   * 在控制台打印一个警告（支持格式化输出）
   * @param messages 需要输出的字符串
   */
  warning(...messages: unknown[]): void {
    /* IFDEBUG */
    if (messages.length === 0) {
      messages.push('');
    }
    if (typeof messages[0] !== 'string') {
      messages.unshift('');
    }
    console.log('%cWARNING%c %s', 'color:yellow;', '', ...messages);
    /* FIDEBUG */
  },

  /**
   * 在控制台打印一个错误（支持格式化输出）
   * @param messages 需要输出的字符串
   */
  error(...messages: unknown[]): void {
    // 错误信息始终显示
    if (messages.length === 0) {
      messages.push('');
    }
    if (typeof messages[0] !== 'string') {
      messages.unshift('');
    }
    console.log('%cERROR%c %s', 'color:red;', '', ...messages);
  }
};