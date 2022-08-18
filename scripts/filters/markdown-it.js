/* global hexo */

'use strict';

const mdContainer = require('../plugins/markdown-it-container');

/**
 * 获取一个规则的渲染器
 * @param {*} md markdown-it
 * @param {string} rule 规则名 / token.type
 * @returns 默认渲染器
 */
function getRuleRenderer(md, rule) {
  // Remember old renderer, if overridden, or proxy to default renderer
  return md.renderer.rules[rule] || function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options, env);
  };
}

// 为表格添加一个 container 来处理 overflow
function supportTableContainer(md) {
  const defaultRender1 = getRuleRenderer(md, 'table_open');
  const defaultRender2 = getRuleRenderer(md, 'table_close');

  md.renderer.rules.table_open = (...args) => {
    const rawCode = defaultRender1(...args);
    return '<div class="table-container">' + rawCode;
  };

  md.renderer.rules.table_close = (...args) => {
    const rawCode = defaultRender2(...args);
    return rawCode + '</div>';
  };
}

// 给 image 添加 title
function supportImageTitle(md) {
  const defaultRender = getRuleRenderer(md, 'image');

  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const aIndex = token.attrIndex('title');

    if (aIndex < 0) {
      token.attrPush(['title', token.content]); // add
    } else {
      token.attrs[aIndex][1] = token.content; // replace
    }

    return defaultRender(tokens, idx, options, env, self);
  };
}

// 增加对 note 提醒块的支持
function supportNoteContainer(md, name) {
  md.use(mdContainer, name, {
    render: function (tokens, idx, options, env, self) {
      // add a class to the opening tag
      if (tokens[idx].nesting === 1) {
        tokens[idx].attrJoin('class', 'note-' + name);
      }

      return self.renderToken(tokens, idx, options, env);
    }
  });
}

// 增加对 tab 标签卡的支持
function supportTabContainer(md) {
  const name = 'tab';

  md.use(mdContainer, name, {
    marker: ';',
    validate: function (params) {
      const reg = new RegExp(`^${name}\\s+\\S+`);
      return params.trim().match(reg);
    },
    render: function (tokens, idx, options, env, self) {
      // add attr to the opening tag
      if (tokens[idx].nesting === 1) {
        const reg = new RegExp(`^${name}\\s+(\\S+)(.*)$`);
        const m = tokens[idx].info.trim().match(reg);
        const tabId = m[1];
        const tabName = md.utils.escapeHtml(m[2] || name).trim();

        tokens[idx].attrJoin('class', 'tab');
        tokens[idx].attrJoin('tab-id', tabId);
        tokens[idx].attrJoin('tab-name', tabName);
      }

      return self.renderToken(tokens, idx, options, env);
    }
  });
}

// 增加对 math 数学公式的支持
function supportMathJax(md) {
  md.use(require('../plugins/markdown-it-mathjax'));
}


let initialized = false;

// 添加 features
hexo.extend.filter.register('markdown-it:renderer', function (md) {
  if (initialized) {
    return;
  }

  // 只执行一次，原因见 hexo-renderer-markdown-it 源码：
  // 它使用同一个 parser 解析所有 markdown
  // 然而这个 filter 在每次解析 markdown 前都会调用一次
  // 所以我只要修改一次 parser 即可
  initialized = true;

  // beautify markdown
  supportTableContainer(md);
  supportImageTitle(md);

  // containers
  supportNoteContainer(md, 'primary');
  supportNoteContainer(md, 'secondary');
  supportNoteContainer(md, 'success');
  supportNoteContainer(md, 'danger');
  supportNoteContainer(md, 'warning');
  supportNoteContainer(md, 'info');
  supportTabContainer(md);

  // math
  supportMathJax(md);
});
