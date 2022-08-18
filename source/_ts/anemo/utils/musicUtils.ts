import debugUtils from './debugUtils';

const musicLinkParseRules = [
  ['music.163.com.*song.*id=(\\d+)', 'netease', 'song'],
  ['music.163.com.*album.*id=(\\d+)', 'netease', 'album'],
  ['music.163.com.*artist.*id=(\\d+)', 'netease', 'artist'],
  ['music.163.com.*playlist.*id=(\\d+)', 'netease', 'playlist'],
  ['music.163.com.*discover/toplist.*id=(\\d+)', 'netease', 'playlist'],
  ['y.qq.com.*song/(\\w+).html', 'tencent', 'song'],
  ['y.qq.com.*album/(\\w+).html', 'tencent', 'album'],
  ['y.qq.com.*singer/(\\w+).html', 'tencent', 'artist'],
  ['y.qq.com.*playsquare/(\\w+).html', 'tencent', 'playlist'],
  ['y.qq.com.*playlist/(\\w+).html', 'tencent', 'playlist'],
  ['xiami.com.*song/(\\w+)', 'xiami', 'song'],
  ['xiami.com.*album/(\\w+)', 'xiami', 'album'],
  ['xiami.com.*artist/(\\w+)', 'xiami', 'artist'],
  ['xiami.com.*collect/(\\w+)', 'xiami', 'playlist'],
];

export interface MusicInfo {
  title: string;
  author: string;
  url: string;
  pic: string;
  lrc: string;
}

export type MusicLinkMeta = Record<'server' | 'type' | 'id', string>;

export default {
  parseLink(link: string): MusicLinkMeta | null {
    for (const rule of musicLinkParseRules) {
      const pattern = new RegExp(rule[0]);
      const res = pattern.exec(link);

      if (!res) {
        continue;
      }

      return {
        'server': rule[1],
        'type': rule[2],
        'id': res[1]
      };
    }

    return null;
  },

  async requestAPIAsync(links: string[]): Promise<MusicInfo[]> {
    const promises = links.map(async link => {
      const meta = this.parseLink(link);

      if (!meta) {
        debugUtils.warning('invalid music link: ' + link);
        return [];
      }

      const url = `https://api.i-meto.com/meting/api?server=${meta.server}&type=${meta.type}&id=${meta.id}&r=${Math.random()}`;
      const res = await fetch(url);
      return await res.json(); // MediaInfo[]
    });

    const results: MusicInfo[][] = await Promise.all(promises);
    return results.flat(1);
  },

  formatTime(seconds: number): string {
    const hour = Math.floor(seconds / 3600);
    const min = Math.floor((seconds - hour * 3600) / 60);
    const sec = Math.floor(seconds - hour * 3600 - min * 60);
    return (hour > 0 ? [hour, min, sec] : [min, sec]).map(num => {
      return isNaN(num) ? '00' : (num < 10 ? ('0' + num) : ('' + num));
    }).join(':');
  },

  autoplay(callback: () => void): (() => void) {
    let enable = true;

    const trigger = () => {
      if (!enable) {
        return;
      }

      enable = false;

      callback();

      document.removeEventListener('mousedown', trigger);
      document.removeEventListener('scroll', trigger);
      document.removeEventListener('touchstart', trigger);
    };

    document.addEventListener('mousedown', trigger);
    document.addEventListener('scroll', trigger);
    document.addEventListener('touchstart', trigger);

    // return a function to cancel autoplay
    return () => {
      if (!enable) {
        return;
      }

      document.removeEventListener('mousedown', trigger);
      document.removeEventListener('scroll', trigger);
      document.removeEventListener('touchstart', trigger);
    };
  }
};