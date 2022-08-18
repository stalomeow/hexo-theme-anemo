/* global hexo */

'use strict';

/*
 * {% mermaid %}
 * text
 * {% endmermaid %}
 */
hexo.extend.tag.register('mermaid', (args, content) => {
  return `<div class="mermaid" ${args.join(' ')}>${content}</div>`;
}, { ends: true });
