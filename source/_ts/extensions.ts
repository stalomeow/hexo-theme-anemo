Object.assign(Element.prototype, {
  attr: function (qualifiedName: string, value?: string | null): string | null | Element {
    const e = this as unknown as Element;

    if (typeof value === 'undefined') {
      return e.getAttribute(qualifiedName);
    }

    if (typeof value === 'string') {
      e.setAttribute(qualifiedName, value);
      return e;
    }

    // null
    e.removeAttribute(qualifiedName);
    return e;
  },
  addClass: function (...classNames: string[]): Element {
    const e = this as unknown as Element;
    classNames.forEach(v => e.classList.add(v));
    return e;
  },
  removeClass: function (...classNames: string[]): Element {
    const e = this as unknown as Element;
    classNames.forEach(v => e.classList.remove(v));
    return e;
  },
  toggleClass: function (...classNames: string[]): Element {
    const e = this as unknown as Element;
    classNames.forEach(v => e.classList.toggle(v));
    return e;
  },
  hasClass: function (className: string): boolean {
    const e = this as unknown as Element;
    return e.classList.contains(className);
  }
});

Object.assign(HTMLElement.prototype, {
  top: function (): number {
    const e = this as unknown as HTMLElement;
    let result = e.offsetTop;
    let parent = e.offsetParent as (HTMLElement | null);

    while (parent) {
      result += parent.offsetTop;
      parent = parent.offsetParent as (HTMLElement | null)
    }

    return result;
  },
  left: function (): number {
    const e = this as unknown as HTMLElement;
    let result = e.offsetLeft;
    let parent = e.offsetParent as (HTMLElement | null);

    while (parent) {
      result += parent.offsetLeft;
      parent = parent.offsetParent as (HTMLElement | null)
    }

    return result;
  },
  css: function (
    propertyNameOrProperties: string | Record<string, string | null>,
    value?: string | null
  ): string | HTMLElement {
    const e = this as unknown as HTMLElement;

    if (typeof propertyNameOrProperties === 'string') {
      if (typeof value === 'undefined') {
        const style = getComputedStyle(e);
        return style.getPropertyValue(propertyNameOrProperties);
      }

      e.style.setProperty(propertyNameOrProperties, value);
    } else {
      for (const propertyName in propertyNameOrProperties) {
        const value = propertyNameOrProperties[propertyName];
        e.style.setProperty(propertyName, value);
      }
    }

    return e;
  },
  wrap: function (container: HTMLElement): HTMLElement {
    const e = this as unknown as HTMLElement;
    const parent = e.parentElement!;

    parent.insertBefore(container, e);
    parent.removeChild(e);
    container.appendChild(e);
    return e;
  }
});

Object.assign(Array.prototype, {
  peek: function (): unknown {
    const array = this as unknown[];

    if (array.length === 0) {
      return undefined;
    }

    return array[array.length - 1];
  }
});