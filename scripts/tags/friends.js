/* global hexo */

'use strict';

/*
 * {% mermaid %}
 * text
 * {% endmermaid %}
 */
hexo.extend.tag.register('friends', (args, content) => {
  return `<div>${content}</div>`;
}, { ends: true });