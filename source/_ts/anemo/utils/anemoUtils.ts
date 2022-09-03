export default {
  timingFunctions: {
    linear(t: number, a: number, b: number): number {
      return a + t * (b - a);
    },

    easeIn(t: number, a: number, b: number): number {
      return a + t * t * (b - a);
    },

    easeOut(t: number, a: number, b: number): number {
      return a + (2 * t - t * t) * (b - a);
    }
  },

  randomInt(minInclusive: number, maxExclusive: number): number {
    return Math.floor((Math.random() * maxExclusive) + minInclusive);
  },

  scrollTo(elementOrTop: HTMLElement | number, animate = true): void {
    const argIsNumber = typeof elementOrTop === 'number';
    const top = argIsNumber ? elementOrTop : elementOrTop.top();
    window.scrollTo({
      top: top,
      behavior: animate ? 'smooth' : undefined
    });
  },

  /**
   * 16 进制颜色代码转 RGBA
   * @param hex 16 进制颜色代码
   * @param a 透明度 [0, 1]
   * @returns RGBA 颜色值
   */
  hexToRGBA(hex: string, a: number): string {
    const r = parseInt('0x' + hex.slice(1, 3));
    const g = parseInt('0x' + hex.slice(3, 5));
    const b = parseInt('0x' + hex.slice(5, 7));
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  },

  /**
   * RGB 转 RGBA
   * @param rgb RGB(A) 颜色值
   * @param a 透明度 [0, 1]
   * @returns RGBA 颜色值
   */
  RGBToRGBA(rgb: string, a: number): string {
    const components = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*[\d.]+\s*)?\)/i);
    return `rgba(${components![1]}, ${components![2]}, ${components![3]}, ${a})`;
  },

  /**
   * 设置颜色的 Alpha 通道
   * @param color 颜色（HEX 或 RGB 或 RGBA）
   * @param a 透明度 [0, 1]
   * @returns 新的颜色值（RGBA）
   */
  setColorAlpha(color: string, a: number): string {
    if (color.startsWith('#')) {
      return this.hexToRGBA(color, a);
    } else {
      return this.RGBToRGBA(color, a);
    }
  }
};