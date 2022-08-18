/* global hexo */

'use strict';

const stylus = require('stylus');

/**
 * 将 JS 对象转换为 stylus 的 Object Node
 * @param {*} obj JS 对象
 * @returns stylus 的 Object Node
 */
function convertToStylusNode(obj) {
  const result = new stylus.nodes.Object();

  for (const key in obj) {
    // 这里将值强制转化成 string
    // 因为在 stylus 中要统一做 unquote 操作
    const value = obj[key].toString();

    // key 为 new stylus.nodes.String(key) 的 hash
    result.setKey(key, new stylus.nodes.String(key));
    result.setValue(key, new stylus.nodes.String(value));

    // 从 stylus 的 JS 源码中得知
    // stylus 中 obj[key] 在 JS 中实现方法为 objNode.vals[keyNode.hash]
    // 其中 objNode 中保存了下面两个映射：
    // 1. keys: hash(string) -> keyNode(node)
    // 2. vals: hash(string) -> valNode(node)
    // 所以给 obj 添加成员时要同时 setKey 和 setValue
  }

  return result;
}


hexo.extend.filter.register('stylus:renderer', function (style) {
  const lightVars = hexo.theme.config.css_vars.light;
  const darkVars = hexo.theme.config.css_vars.dark;

  style.define('$css-light-vars', convertToStylusNode(lightVars));
  style.define('$css-dark-vars', convertToStylusNode(darkVars));
});