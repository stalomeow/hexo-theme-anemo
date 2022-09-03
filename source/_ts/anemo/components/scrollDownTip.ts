import $ from '../$';
import { IComponent } from '../component';
import anemoUtils from '../utils/anemoUtils';

const component_scrollDownTip: IComponent = {
  name: 'scroll-down-tip',

  initialize(): boolean {
    return true;
  },

  refresh: function () {
    $('.scroll-down-tip')?.addEventListener('click', function () {
      const main = $<HTMLElement>('#page');
      main && anemoUtils.scrollTo(main); // 滚动到 main
    });
  }
};

export default component_scrollDownTip;