/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/ban-types */
/* global VoidFunction, NodeListOf */

declare type PjaxSwitch = (
  oldEl: Element,
  newEl: Element,
  options?: PjaxOptions,
  switchesOptions?: Record<string, unknown>
) => void;

declare interface PjaxRequestParams {
  name: string;
  value: string;
}

declare interface PjaxOptions {
  /**
   * CSS selector to use to retrieve links to apply Pjax to.
   */
  elements: string;

  /**
   * CSS selectors for the elements to replace.
   */
  selectors: string[];

  /**
   * Objects containing callbacks that can be used to switch old elements with new elements.
   * Keys should be one of the defined selectors.
   */
  switches: Record<string, PjaxSwitch>;

  /**
   * These are options that can be used during switches.
   * Keys should be one of the defined selectors.
   */
  switchesOptions: Record<string, unknown>;

  /**
   * Enable the use of pushState(). Disabling this will prevent Pjax from updating browser history.
   * Internally, this option is used when a popstate event triggers Pjax (to not pushState() again).
   */
  history: boolean;

  /**
   * Function that allows you to add behavior for analytics.
   * By default it tries to track a page view with Google Analytics (if it exists on the page).
   * It's called every time a page is switched, even for history navigation.
   * Set to false to disable this behavior.
   */
  analytics: Function | false;

  /**
   * When set to an integer, this is the value (in px from the top of the page) to scroll to when a page is switched.
   * When set to an array of 2 integers ([x, y]), this is the value to scroll both horizontally and vertically.
   * Set this to false to disable scrolling, which will mean the page will stay in that same position it was before
   * loading the new elements.
   */
  scrollTo: number | [number, number] | false;

  /**
   * When set to true, attempt to restore the scroll position when navigating backwards or forwards.
   */
  scrollRestoration: boolean;

  /**
   * When set to true, append a timestamp query string segment to the requested URLs in order to skip browser cache.
   */
  cacheBust: boolean;

  /**
   * Enables verbose mode.
   */
  debug: boolean;

  /**
   * The timeout in milliseconds for the XHR requests. Set to 0 to disable the timeout.
   */
  timeout: number;

  /**
   * When set to true, clicking on a link that points to the current URL will trigger a full page reload.
   * (Note that if cacheBust is set to true, the code that checks if the href is the same as the current page's URL
   * will not work, due to the query string appended to force a cache bust).
   */
  currentUrlFullReload: boolean;

  /**
   * Hold the information to make an XHR request.
   */
  requestOptions?: {
    requestUrl?: string;
    requestMethod?: string;
    requestParams?: PjaxRequestParams[];
    formData?: FormData;
  }
}

declare enum PjaxDefaultSwitches {
  innerHTML = 'innerHTML',
  outerHTML = 'outerHTML',
  sideBySide = 'sideBySide',
  replaceNode = 'replaceNode'
}

declare class Pjax {
  options: PjaxOptions;

  constructor(options?: Partial<PjaxOptions>);

  static switches: Record<PjaxDefaultSwitches, PjaxSwitch>;

  /**
   * Checks if Pjax is supported by the environment.
   */
  static isSupported: () => boolean;

  log: VoidFunction;

  getElements(el: Element | Document): NodeListOf<Element>;

  parseDOM(el: Element | Document): void;

  refresh: (el: Element) => void;

  reload: VoidFunction;

  attachLink(el: HTMLAnchorElement): void;

  attachForm(el: HTMLFormElement): void;

  forEachSelectors(cb: (el: Element) => void, context: Pjax, DOMcontext?: Element | Document): void;

  switchesSelectors(selectors: string[], fromEl: Element | Document, toEl: Element | Document, options: PjaxOptions): void;

  latestChance(href: string): void;

  onSwitch: VoidFunction;

  /**
   * Loads the HTML from the response into the DOM.
   *
   * @param {string} html
   * @param {PjaxOptions} options
   */
  loadContent(html: string, options: PjaxOptions): void;

  /**
   * Aborts an ongoing XHR request.
   *
   * @param {XMLHttpRequest} request
   */
  abortRequest(request: XMLHttpRequest): void;

  /**
   * Makes the XHR request.
   *
   * @param {string} location The URI for the request.
   * @param {PjaxOptions | null} options
   * @param {(requestText: string, request: XMLHttpRequest, href: string) => void} callback The callback to call when
   * the response is received. The signature should match that of <code>handleResponse</code>.
   * @returns {XMLHttpRequest}
   */
  doRequest(location: string, options: PjaxOptions | null,
            callback: (requestText: string, request: XMLHttpRequest, href: string) => void): XMLHttpRequest;

  /**
   * Saves the state, updates the URL if there were any redirects, then calls loadContent().
   *
   * @param {string} requestText The raw text of the response. Same as <code>request.responseText</code>.
   * @param {XMLHttpRequest} request The XHR object.
   * @param {string} href The original URI used to initiate the request.
   * @param options The Pjax options object used for the request
   */
  handleResponse(requestText: string, request: XMLHttpRequest, href: string, options?: PjaxOptions): void;

  /**
   * Initiates the request by calling <code>doRequest()</code>.
   * @param {string} href
   * @param {PjaxOptions} options
   */
  loadUrl(href: string, options?: PjaxOptions): void;

  /**
   * Called after all switches complete (even async).
   */
  afterAllSwitches: VoidFunction;

  /**
   * Allows reassignment of existing prototype functions to be able to do something before calling the original function.
   * For example:
   *
   * <pre>
   *   pjax._handleResponse = pjax.handleResponse;
   *   pjax.handleResponse = (requestText: string, request: XMLHttpRequest, href: string) => {
   *     return pjax._handleResponse(requestText, request, href);
   *   }
   * </pre>
   */
  [key: string]: Function | PjaxOptions;
}