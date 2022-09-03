import $ from '../$';
import { IComponent } from '../component';
import anemoUtils from '../utils/anemoUtils';
import configManager from '../managers/configManager';
import debugUtils from '../utils/debugUtils';

const markdownBodySelector = '.markdown-body';

function beautifyH1H2(md: HTMLElement) {
  $.each('h1, h2', heading => {
    const span = $.create('span');

    // 把标题内容用 span 包裹起来
    Array.from(heading.childNodes).forEach((node, i) => {
      if (i > 0) {
        span.appendChild(node); // 把 node 移动到 span 里
      }
      // else the node is a header-anchor, do nothing
    });

    heading.appendChild(span);
  }, md);
}

function beautifyTabs(md: HTMLElement) {
  $.each<HTMLElement>('div.tab', tab => {
    const tabId = tab.attr('tab-id');
    const tabName = tab.attr('tab-name');

    if (!tabId || !tabName) {
      return;
    }

    let box = $<HTMLDivElement>('#' + tabId, md);
    let nav: HTMLElement;
    let isFirstTab: boolean;

    if (box) {
      box.appendChild(tab);
      nav = $.assert('.tabs-nav', box);
      isFirstTab = false;
    } else {
      box = $.create('div', {
        'id': tabId,
        'class': 'tabs'
      });
      tab.wrap(box);

      nav = $.create('ul', { 'class': 'tabs-nav' });
      box.insertBefore(nav, tab);

      isFirstTab = true;
    }

    const li = $.create('li');
    li.textContent = tabName;
    nav.appendChild(li);

    if (isFirstTab) {
      tab.attr('active', '');
      li.attr('active', '');
    }

    li.addEventListener('click', () => {
      $.all('[active]', box!).forEach(v => v.attr('active', null));
      $.assert(`.tab[tab-name="${tabName}"]`, box!).attr('active', '');
      li.attr('active', '');
    });
  }, md);
}

function beautifyCodeblocks(md: HTMLElement) {
  const expandButtonClass = 'show-btn';
  const expandButtonOpenClass = 'show-btn-open';

  function getToolsBgClass(ele: HTMLElement): string {
    const light = 'tools-light';
    const dark = 'tools-dark';

    const rgbArr = ele.css('background-color')
      .replace(/rgba*\(/, '')
      .replace(')', '')
      .split(',');

    const color = (0.213 * parseFloat(rgbArr[0]))
      + (0.715 * parseFloat(rgbArr[1]))
      + (0.072 * parseFloat(rgbArr[2]))
      > 255 / 2;

    return color ? dark : light;
  }

  function getToolsHTML(bgClass: string, lang: string, copyButton: boolean): string {
    let toolsHtml = `<div class="highlight-tools ${bgClass}">`;
    toolsHtml += `<span class="lang">${lang}</span>`;

    if (copyButton) {
      toolsHtml += '<span class="copy-btn" data-clipboard-snippet>COPY</span>';
    }

    toolsHtml += '</div>';
    return toolsHtml;
  }

  function codeblockTools(copyButton: boolean): void {
    $.each<HTMLElement>('pre', pre => {
      const bgClass = getToolsBgClass(pre);

      let caption: HTMLElement | null;
      let lang: string | null;

      // if (figure.length > 0) {
      //   // highlightjs
      //   caption = figure.find('figcaption');
      //   lang = caption.length > 0 ? caption.text() : figure.attr('class')?.split(' ').pop();

      //   figure.css('background-color', figure.find('.hljs').css('background-color'));
      // } else

      if (pre.attr('class')?.includes('language-')) {
        // prismjs
        caption = $('.caption', pre);
        lang = caption ? caption.textContent : pre.attr('data-language');
      } else {
        // unknown
        return;
      }

      const wrapper = $.create('div', { 'class': 'code-wrapper' });
      pre.wrap(wrapper);

      const html = getToolsHTML(bgClass, lang || 'unknown', copyButton);
      wrapper.insertAdjacentHTML('beforeend', html);

      caption?.remove();
    }, md);
  }

  function switchCodeblockFoldState(table: HTMLElement, button: HTMLElement, maxHeight: number, open?: boolean): void {
    if (open === undefined) {
      open = !button.hasClass(expandButtonOpenClass);
    }

    if (open) {
      button.addClass(expandButtonOpenClass);
      table.attr('style', null);
    } else {
      button.removeClass(expandButtonOpenClass);
      table.attr('style', `height:${maxHeight}px;overflow:hidden;`);
    }
  }

  function foldCodeblock(): void {
    const codeConfig = configManager.siteConfig.code;

    if (!codeConfig.fold.enable) {
      return;
    }

    const maxHeight = codeConfig.fold.maxHeight;
    const downArrowIcon = codeConfig.fold.downArrowIcon;

    // highlightjs
    // $('figure.highlight', md).each((index, figureElement) => {
    //   const figure = $(figureElement);
    //   const table = figure.find('table');

    //   if (table[0].clientHeight > maxHeight) {
    //     const codeblockBG = figure.find('.hljs').css('background-color');
    //     const transparent = FluidUtility.setColorAlpha(codeblockBG, 0);

    //     const button = $('<div>', {
    //       class: Codeblock.expandButtonClass,
    //       style: `background-image: linear-gradient(to bottom, ${transparent} 0, ${codeblockBG} 70%);`,
    //       click: function () {
    //         Codeblock.switchCodeblockFoldState(table, $(this), maxHeight);
    //       }
    //     }).appendTo(figure);
    //     button.append(`<i class="${downArrowIcon}"></i>`);
    //     Codeblock.switchCodeblockFoldState(table, button, maxHeight, false);
    //   }
    // });

    // prismjs
    $.each<HTMLElement>('pre[class*=language-]', pre => {
      if (pre.clientHeight <= maxHeight) {
        return;
      }
      const codeblockBG = pre.css('background-color');
      const transparent = anemoUtils.setColorAlpha(codeblockBG, 0);

      const button = $.create('div', {
        'class': expandButtonClass,
        'style': `background-image: linear-gradient(to bottom, ${transparent} 0, ${codeblockBG} 90%);`
      });

      button.insertAdjacentHTML('beforeend', `<i class="${downArrowIcon}"></i>`);
      button.addEventListener('click', () => switchCodeblockFoldState(pre, button, maxHeight));

      pre.parentElement!.appendChild(button);

      switchCodeblockFoldState(pre, button, maxHeight, false);
    }, md);
  }

  const copyButton = true; // this.enableCopyButton;

  codeblockTools(copyButton);
  foldCodeblock(); // must be called after codeblockTools

  // if (copyButton) {
  //   this.codeblockToolsCopyButton();
  // }
}

const component_markdownBeautifier: IComponent = {
  name: 'markdown-beautifier',

  initialize(): boolean { return true },

  refresh(): void {
    const markdown = $<HTMLElement>(markdownBodySelector);

    if (!markdown) {
      debugUtils.warning('no markdown.');
      return;
    }

    // 开始美化
    beautifyH1H2(markdown);
    beautifyTabs(markdown);
    beautifyCodeblocks(markdown);
  }
};

export default component_markdownBeautifier;