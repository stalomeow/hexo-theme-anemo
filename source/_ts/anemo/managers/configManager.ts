/* eslint-disable @typescript-eslint/no-explicit-any */

const configFileUrl = '/site-config.json';
const configObj = {};

export default {
  get siteConfig(): Record<string, any> {
    return configObj;
  },

  get pageConfig(): Record<string, any> {
    return {};
  },

  async initializeAsync(): Promise<void> {
    const response = await fetch(configFileUrl);
    Object.assign(configObj, await response.json());
  }
};