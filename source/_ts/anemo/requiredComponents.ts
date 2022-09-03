import component_bannerBeautifier from './components/bannerBeautifier';
import component_bgMusic from './components/bgMusic';
import component_comment_twikoo from './components/comments/twikoo';
import component_fancybox from './components/fancybox';
import component_genshinBanner from './components/genshinBanner';
import component_localSearch from './components/localSearch';
import component_markdownBeautifier from './components/markdownBeautifier';
import component_mermaid from './components/mermaid';
import component_pagination from './components/pagination';
import component_scrollDownTip from './components/scrollDownTip';
import component_sidebar from './components/sidebar';
import component_toc from './components/toc';

// 按以下顺序初始化和刷新
export default [
  component_scrollDownTip,

  // 在 markdownBeautifier 前构建 toc，
  // 因为 markdownBeautifier 会改变一些标题的内部结构
  //（其实也无所谓，我只是想把 toc 放这）
  component_toc,
  component_sidebar, // 逻辑代码不依赖 toc
  component_markdownBeautifier,

  component_pagination,
  component_localSearch,
  component_bgMusic,

  component_fancybox,
  component_mermaid,

  component_comment_twikoo,

  component_bannerBeautifier,
  component_genshinBanner
] as const;