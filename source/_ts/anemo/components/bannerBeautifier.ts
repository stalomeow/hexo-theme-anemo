import $ from '../$';
import { IComponent } from '../component';

function beautifyBanner() {
  const banner = $<HTMLElement>('header.banner');

  if (!banner) {
    return;
  }

  const multiplier = parseInt(banner.attr('banner-height') || '100') / 100;
  const height = Math.ceil(window.innerHeight * multiplier);
  banner.css('height', height + 'px');
}

const component_bannerBeautifier: IComponent = {
  name: 'banner-beautifier',

  initialize(): boolean {
    window.addEventListener('resize', () => beautifyBanner());
    return true;
  },

  refresh(): void {
    beautifyBanner();
  }
};

export default component_bannerBeautifier;