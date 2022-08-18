import debugUtils from './debugUtils';

export interface IUserPref {
  /**
   * 获取一项用户偏好
   * @param key 该项的键值
   */
  (key: string): string | null;

  /**
   * 设置一项用户偏好
   * @param key 该项的键值
   * @param value 该项的值。如果为 null 则移除该项
   */
  (key: string, value: string | null): void;
}

function userPref(key: string, value?: string | null): string | null | void {
  try {
    if (typeof value === 'undefined') {
      return localStorage.getItem(key);
    } else if (typeof value === 'string') {
      localStorage.setItem(key, value);
      debugUtils.info('save user pref \'%s\': \'%s\'', key, value);
    } else { // null
      localStorage.removeItem(key);
      debugUtils.info('remove user pref \'%s\'', key);
    }
  } catch (e) {
    if (typeof value === 'undefined') {
      debugUtils.error('can not get user pref', e);
    } else if (typeof value === 'string') {
      debugUtils.error('can not set user pref', e);
    } else { // null
      debugUtils.error('can not remove user pref', e);
    }
  }
}

export default userPref as IUserPref;