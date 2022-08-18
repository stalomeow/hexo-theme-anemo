import $ from '../$';
import { IComponent } from '../component';
import debugUtils from '../utils/debugUtils';
import pjaxManager from '../managers/pjaxManager';

const paginationContainerSelector = '#pagination';
const paginationEndedAttr = 'ended';

interface PaginationInfo {
  container: HTMLElement; // pagination 元素
  trigger: HTMLElement; // 触发器元素（点击后加载下一页）
  current: number; // 当前页
  total: number; // 页数
  format: string; // 页面源文件的 url 的格式（%d 代表页面编号）
  selector: string; // 包裹正文内容的容器的选择器
}

function getPaginationInfo(): PaginationInfo | undefined {
  const container = $<HTMLElement>(paginationContainerSelector);

  if (
    !container ||
    container.childElementCount !== 1 ||
    container.hasAttribute(paginationEndedAttr)
  ) {
    return undefined;
  }

  const trigger = container.children[0] as HTMLElement;
  const result = {
    container: container,
    trigger: trigger
  } as PaginationInfo & Record<string, unknown>;

  // 从 attr 中读取下面这些值
  const keys = ['current', 'total', 'format', 'selector'];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = trigger.attr(key);

    if (value) {
      result[key] = (i < 2) ? parseInt(value) : value;
      trigger.attr(key, null); // remove it
    } else {
      debugUtils.error(`the pagination info lacks attribute '${key}'!`);
      return undefined;
    }
  }

  return result;
}

const component_pagination: IComponent = {
  name: 'pagination',

  initialize(): boolean { return true },

  refresh(): void {
    const info = getPaginationInfo();

    if (!info) {
      debugUtils.info('no pagination.');
      return;
    }

    const changePage = async () => {
      info.container.attr('loading', ''); // 开始加载
      info.current++; // 下一页

      const url = info.format.replace('%d', info.current.toString());
      const response = await fetch(url);
      const htmlText = await response.text();
      const nextPage = new DOMParser().parseFromString(htmlText, 'text/html');

      const contentContainer = $.assert(info.selector);
      const newContent = $.assert(info.selector, nextPage);

      pjaxManager.pjax?.refresh(newContent);

      // 这里 **一定** 要拷贝一次 childNodes！！！
      //
      // 因为后面 appendChild 的时候，
      // 被 append 的 child 会立刻被从原本的父元素下移除。
      // 也就是说迭代过程中会修改原集合。
      //
      // 解决方案：
      // 1. 倒过来遍历
      // 2. 拷贝原集合 （我选择的方案）
      Array.from(newContent.childNodes).forEach(child => {
        contentContainer.appendChild(child);
      });

      if (info.current === info.total) {
        info.container.attr(paginationEndedAttr, '');
        info.trigger.removeEventListener('click', changePage);
      }

      debugUtils.info(`pagination: ${info.current - 1} -> ${info.current}.`);

      info.container.attr('loading', null); // 结束加载
    };

    info.trigger.addEventListener('click', changePage);
  }
};

export default component_pagination;