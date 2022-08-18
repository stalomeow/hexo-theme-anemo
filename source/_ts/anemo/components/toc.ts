import $ from '../$';
import { IComponent } from '../component';
import anemoUtils from '../utils/anemoUtils';
import debugUtils from '../utils/debugUtils';


const tocSelector = '.toc-body';
const tocHeaderSelector = '.toc-header';
const contentSelector = '.markdown-body';
const headingSelector = 'h1,h2,h3,h4,h5,h6';
const linkClass = 'tocbot-link';
const activeLinkClass = 'tocbot-active-link';
const listClass = 'tocbot-list';
const listItemClass = 'toc-list-item';
const activeListItemClass = 'is-active-li';
const isCollapsedClass = 'tocbot-is-collapsed';
const collapsibleClass = 'tocbot-is-collapsible';
const navbarHeight = 120; // offset


function calcDepth(heading: HTMLElement): number {
  // example:
  // h1 -> 1
  // h2 -> 2
  // ...
  return parseInt(heading.tagName.substring(1));
}

function createList(parent: HTMLElement, collapsible: boolean): HTMLElement {
  const tocList = $.create('ol', { 'class': listClass });
  parent.appendChild(tocList);

  if (collapsible) {
    tocList.addClass(collapsibleClass, isCollapsedClass);
  }

  return tocList;
}

function addItem(tocList: HTMLElement, heading: HTMLElement): HTMLElement {
  const link = $.create('a', {
    'href': '#' + heading.id,
    'class': linkClass
  });

  // 把 heading 的子节点拷贝到 link 里
  heading.childNodes.forEach((child, i) => {
    if (i > 0) { // 第一个结点是 header-anchor，不拷贝
      const newNode = child.cloneNode(true);
      link.appendChild(newNode);
    }
  });

  const li = $.create('li', { 'class': listItemClass });
  li.appendChild(link);
  tocList.appendChild(li);

  return li;
}

function buildTOC(headings: HTMLElement[], parent: HTMLElement): HTMLAnchorElement[] {
  if (headings.length === 0) {
    return [];
  }

  // dp[i].item : the toc item representing headings[i - 1]
  // dp[0].item : the parent parameter, specially
  // dp[i].list : the ol/ul element in dp[i].item
  const dp: { item: HTMLElement; list?: HTMLElement; }[] = [];
  // lastHeadings[depth] : index
  // headings[index - 1] : the last heading with specific depth if exists
  // dp[index] : I think you know it. 诶嘿~
  const lastHeadings = [0, -1, -1, -1, -1, -1, -1]; // fixed length 7
  // stores all the toc links
  const tocLinks: HTMLAnchorElement[] = [];

  dp[0] = {
    item: parent,
    list: createList(parent, false) // 最外层的列表不许折叠，不然啥也看不见了
  };

  for (let i = 1; i <= headings.length; i++) {
    const heading = headings[i - 1];
    const depth = calcDepth(heading);

    // 找深度比自己小并且离自己最近的标题，然后折叠进去
    const j = Math.max(...lastHeadings.slice(0, depth));
    const list = (dp[j].list ??= createList(dp[j].item, true));

    dp[i] = { item: addItem(list, heading) };
    lastHeadings[depth] = i;
    tocLinks.push(dp[i].item.children[0] as HTMLAnchorElement);
  }

  return tocLinks;
}

function updateToc(
  headings: HTMLElement[],
  tocLinks: HTMLElement[],
  activeIndex: number,
  top: number
): number {
  let currentIndex = -1;

  // find current heading
  for (let i = headings.length - 1; i >= 0; --i) {
    const heading = headings[i];

    if (top > (heading.top() - navbarHeight)) {
      currentIndex = i;
      break;
    }
  }

  if (activeIndex !== currentIndex) {
    // 清除旧的
    if (activeIndex >= 0 && activeIndex < headings.length) {
      const link = tocLinks[activeIndex];
      let parent = link.parentElement!;

      link.removeClass(activeLinkClass);
      parent.removeClass(activeListItemClass);
      link.nextElementSibling?.addClass(isCollapsedClass); // 折叠同级的子列表

      // collapse matched parent
      while (!parent.matches(tocSelector)) {
        if (parent.matches('.' + collapsibleClass)) {
          parent.addClass(isCollapsedClass);
        }

        parent = parent.parentElement!;
      }
    }

    // 添加新的
    if (top > 0 && currentIndex >= 0 && currentIndex < headings.length) {
      const link = tocLinks[currentIndex];
      let parent = link.parentElement!;

      link.addClass(activeLinkClass);
      parent.addClass(activeListItemClass);
      link.nextElementSibling?.removeClass(isCollapsedClass); // 展开同级的子列表

      // expand matched parent
      while (!parent.matches(tocSelector)) {
        if (parent.matches('.' + collapsibleClass)) {
          parent.removeClass(isCollapsedClass);
        }

        parent = parent.parentElement!;
      }
    }
  }

  return currentIndex;
}

function updateScrollPercent(content: HTMLElement, top: number): void {
  // 文章空白时，content.clientHeight 为 0
  // 不做判断的话，算出来 progress 为 NaN
  const progress = content.clientHeight <= 0 ? 1 :
    (Math.max(0, top - content.top()) / content.clientHeight);

  const percentage = Math.min(100, Math.floor(progress * 100));
  $.assert(tocHeaderSelector).attr('progress-percentage', percentage + '%');
}


let scrollEventHandler: (() => void) | null = null;

const component_toc: IComponent = {
  name: 'tocbot',

  initialize(): boolean { return true; },

  cleanup(): void {
    if (!scrollEventHandler) {
      return;
    }

    window.removeEventListener('scroll', scrollEventHandler);
    scrollEventHandler = null;
  },

  refresh(): void {
    const toc = $<HTMLElement>(tocSelector);
    if (!toc) {
      return; // has no toc
    }

    const content = $<HTMLElement>(contentSelector);
    if (!content) {
      debugUtils.warning('can not build toc because there is no content');
      return;
    }

    const headings = Array.from($.all<HTMLElement>(headingSelector, content))
      .filter(v => v.childNodes.length > 1); // 要求除了 header-anchor 外还有节点
    // 上面不检查 textContent，因为有些内容并不是以文字形式存在的，比如 MathJax 公式

    const tocLinks = buildTOC(headings, toc);

    // handle click events
    tocLinks.forEach(link => link.addEventListener('click', e => {
      e.preventDefault();
      anemoUtils.scrollToElement($.assert(link.attr('href')!));
    }));

    let activeIndex = -1;

    // handle window scroll event
    scrollEventHandler = () => {
      const currentTop = window.scrollY || document.documentElement.scrollTop;
      updateScrollPercent(content, currentTop);

      if (tocLinks.length > 0) {
        activeIndex = updateToc(headings, tocLinks, activeIndex, currentTop);
      }
    };

    window.addEventListener('scroll', scrollEventHandler);
    scrollEventHandler(); // update it immediately

    // show toc having items
    $.assert<HTMLElement>('.toc').css('visibility', 'visible');
  }
};

export default component_toc;