/* global hexo */

'use strict';

/*
 * {% tabs id %}
 * <--! tab name1 -->
 * content
 * 
 * <--! tab name2 -->
 * content
 * {% endtabs %}
 */
hexo.extend.tag.register('tabs', (args, content) => {
  const tabs = [];

  content.split(/<!--\s*(tab\s+.+)-->/g).forEach((item, i) => {
    item = item.trim();

    if (item.length === 0) {
      return;
    }

    if (item.startsWith('tab ')) {
      tabs.push({ header: item });
    } else if (tabs.length > 0) {
      const tab = tabs.at(-1);

      if (tab.body === undefined) {
        tab.body = item;
      } else {
        tab.body += '\n' + item;
      }
    }
  });

  if (tabs.length === 0) {
    return content;
  }

  let result = '';

  tabs.forEach((tab, i) => {
    const content = hexo.render.renderSync({ text: tab.body, engine: 'markdown' }).trim();
    result += `<div class="tab" tab-id="${args[0]}" tab-name="${tab.header.substring(4)}">${content}</div>`;
  });

  return result;
}, { ends: true });