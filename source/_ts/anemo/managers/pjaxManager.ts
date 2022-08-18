/* global Pjax, VoidFunction */

let pjaxObj: Pjax | null = null;

export default {
  get pjax(): Pjax | null {
    return pjaxObj;
  },

  initialize(
    enable: boolean,
    options: unknown,
    pjaxSendCallback?: VoidFunction,
    pjaxSuccessCallback?: VoidFunction
  ): void {
    if (enable) {
      pjaxObj = new Pjax(Object.assign({}, options));

      if (pjaxSendCallback) {
        window.addEventListener('pjax:send', pjaxSendCallback);
      }

      if (pjaxSuccessCallback) {
        window.addEventListener('pjax:success', pjaxSuccessCallback);
      }
    }

    // 立刻执行一次，刷新当前页面
    pjaxSuccessCallback?.();
  }
};