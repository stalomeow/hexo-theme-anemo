import $ from '../$';
import { IComponent } from '../component';
import TopLayerPanel from '../miscellaneous/topLayerPanel';
import debugUtils from '../utils/debugUtils';

const searchInputSelector = 'div.search-div>input';
const searchResultsSelector = 'div.search-result-list';

let searchResultNothing = '';
let localSearchInitialized = false;
let searchInput: HTMLInputElement | null = null;
let searchResults: HTMLElement | null = null;
let panel: TopLayerPanel | null = null;

async function initLocalSearchAsync(path: string): Promise<void> {
  searchInput!.disabled = true; // 下面进行初始化，该段时间禁止输入

  // 获取 xml 数据
  const response = await fetch(path);
  const xmlText = await response.text();

  // 解析 xml 数据
  const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
  const data = Array.from($.all('entry', xml)).map(entry => ({
    title: ($('title', entry)?.textContent || 'Untitled').trim(),
    content: ($('content', entry)?.textContent || '').trim().replace(/<[^>]+>/g, ''),
    url: ($('url', entry)?.textContent || '')
  }));

  // 给输入框添加事件，输入的值发生变化时就执行搜索
  searchInput!.addEventListener('input', () => {
    const inputText = searchInput!.value.trim().toLowerCase();
    let resultHTML = '';

    if (inputText.length > 0) {
      // 将输入的字符串分割成关键词列表
      let keywords = inputText.split(' ').filter(k => k.length > 0);
      keywords = Array.from(new Set(keywords)); // 去重
      debugUtils.info('keyword list:', keywords);

      // 转义所有正则表达式中的特殊符号
      const validatedKws = keywords.map(kw => kw.replace(/[()[\]{}$^|?+*.\\]/gi, '\\$&'));
      const kwReg = new RegExp(`(${validatedKws.join('|')})`, 'gi'); // 用来匹配所有关键词
      debugUtils.info('validated keyword list:', validatedKws);

      // 开始搜索
      data.forEach(data => {
        const titleLower = data.title.toLowerCase();
        const contentLower = data.content.toLowerCase();

        let isMatch = true;
        const keywordPos: number[] = [];

        if (contentLower.length > 0) {
          // 匹配所有关键词
          for (const keyword of keywords) {
            const titleIndex = titleLower.indexOf(keyword);
            const contentIndex = contentLower.indexOf(keyword);

            if (titleIndex < 0 && contentIndex < 0) {
              isMatch = false;
              break;
            }

            // 只存文章内容中第一个关键词的位置
            if (contentIndex >= 0) {
              keywordPos.push(contentIndex);
            }
          }
        } else {
          isMatch = false;
        }

        if (!isMatch) {
          return;
        }

        // 准备添加搜索结果
        let matchedContent = '...... ';
        let matchedRanges: [number, number][];

        if (keywordPos.length === 0) {
          // 如果文章内容中无关键词（关键词都在标题里），那么就默认取最前面
          matchedRanges = [[0, Math.min(100, data.content.length)]];
        } else {
          // 从小到大排列
          keywordPos.sort((a, b) => a - b);
          matchedRanges = keywordPos.reduce<[number, number][]>((result, pos) => {
            // 取至多 100 个字符
            const start = Math.max(pos - 20, 0);
            const end = Math.min(start + 100, data.content.length);

            // 如果与前面一项有交集，则把前面的一项与当前这项取并集
            if (result.length > 0) {
              const last = result[result.length - 1];
              if (last[1] >= start) {
                last[1] = end;
                return result;
              }
            }

            result.push([start, end]);
            return result;
          }, []);
        }

        for (const range of matchedRanges) {
          const content = data.content.substring(range[0], range[1]);

          // 高亮所有关键词
          matchedContent += content.replace(kwReg, '<span class="search-word">$&</span>');
          matchedContent += ' ...... ';
        }

        // 顺便高亮一下标题（标题一般不长，所以直接全部高亮）
        const matchedTitle = data.title.replace(kwReg, '<span class="search-word">$&</span>');

        resultHTML += `<a href="${data.url}" class="search-result">`;
        resultHTML += `<span>${matchedTitle}</span>`;
        resultHTML += `<p>${matchedContent}</p>`;
        resultHTML += '</a>';
      });
    }

    if (resultHTML.length === 0) {
      resultHTML = searchResultNothing;
      searchInput!.removeClass('valid');

      if (inputText.length > 0) {
        searchInput!.addClass('invalid')
      }
    } else {
      searchInput!.addClass('valid').removeClass('invalid');
    }

    searchResults!.innerHTML = resultHTML;
  });

  // 初始化结束，允许输入
  localSearchInitialized = true;
  searchInput!.disabled = false;
  searchInput!.focus();
}

function resetLocalSearch(): void {
  searchInput!.value = '';
  searchInput!.removeClass('invalid').removeClass('valid');
  searchResults!.innerHTML = searchResultNothing;
}

// 本地搜索
const component_localSearch: IComponent = {
  name: 'local-search',

  initialize: function (): boolean {
    searchInput = $<HTMLInputElement>(searchInputSelector);
    if (!searchInput) {
      debugUtils.error('can not find ' + searchInputSelector);
      return false;
    }

    searchResults = $<HTMLElement>(searchResultsSelector);
    if (!searchResults) {
      debugUtils.error('can not find ' + searchResultsSelector);
      return false;
    }

    // 保存原来的 html 代码，在搜索失败时使用
    searchResultNothing = searchResults.innerHTML;

    panel = new TopLayerPanel('#search-panel', '#search-btn', {
      afterOpen: () => {
        if (localSearchInitialized) {
          searchInput!.focus();
        } else {
          // 只 lazy 初始化一次
          const relativePath = '/local-search.xml'; //! temp code
          initLocalSearchAsync(relativePath);
        }
      },
      beforeClose: () => searchInput!.blur(),
      afterClose: () => resetLocalSearch()
    });

    return true;
  },

  refresh: function (): void {
    panel!.closeAsync(false, true);
  }
};

export default component_localSearch;