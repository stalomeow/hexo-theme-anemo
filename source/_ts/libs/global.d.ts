/* eslint-disable no-redeclare */
/* eslint-disable @typescript-eslint/no-explicit-any */

declare interface Element {
  addClass(...classNames: string[]): this;
  removeClass(...classNames: string[]): this;
  toggleClass(...classNames: string[]): this;
  hasClass(className: string): boolean;

  attr(qualifiedName: string): string | null;
  attr(qualifiedName: string, value: string | null): this;
}

declare interface HTMLElement {
  top(): number;
  left(): number;

  css(propertyName: string): string;
  css(propertyName: string, value: string | null): this;
  css(properties: Record<string, string | null>): this;

  wrap(container: HTMLElement): this;
}

declare interface Array<T> {
  peek(): T | undefined;
}

declare interface Window {
  twikoo: any;
  Fancybox: any;
  mermaid: any;
  // PAGE_ASSETS: Record<string, string[]>;
}
