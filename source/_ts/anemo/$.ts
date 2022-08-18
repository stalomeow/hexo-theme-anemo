/* global ParentNode NodeListOf HTMLElementTagNameMap */

//! jQuery 的替代方案

/**
 * 选择一个符合条件的元素
 * @param selectors 选择器
 * @param root 根元素
 * @returns 符合条件的元素
 */
export default function $<E extends Element>(selectors: string, root?: ParentNode): E | null {
  return (root || document).querySelector<E>(selectors);
}

/**
 * 选择一个符合条件的元素，并断言其一定存在。如果不存在则报错
 * @param selectors 选择器
 * @param root 根元素
 * @returns 符合条件的元素
 */
$.assert = function <E extends Element>(selectors: string, root?: ParentNode): E {
  const result = $<E>(selectors, root);

  if (!result) {
    throw new Error('can not find element matching (' + selectors + ') in ' + (root || document));
  }
  return result;
}

/**
 * 选择所有符合条件的元素
 * @param selectors 选择器
 * @param root 根元素
 * @returns 由符合条件的元素组成的列表
 */
$.all = function <E extends Element>(selectors: string, root?: ParentNode): NodeListOf<E> {
  return (root || document).querySelectorAll<E>(selectors);
};

/**
 * 遍历所有符合条件的元素
 * @param selectors 选择器
 * @param callback 回调函数
 * @param root 根元素
 */
$.each = function <E extends Element>(
  selectors: string,
  callback: (item: E, index: number, list: NodeListOf<E>) => void,
  root?: ParentNode
): void {
  $.all<E>(selectors, root).forEach(callback);
};

/**
 * 创建一个元素
 * @param tagName 新元素的标签名称
 * @param attributes 新元素的所有 attribute
 * @returns 新元素
 */
$.create = function <K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  attributes?: Record<string, string>
): HTMLElementTagNameMap[K] {
  const result = document.createElement(tagName);

  if (attributes) {
    for (const key in attributes) {
      result.attr(key, attributes[key]);
    }
  }

  return result;
}