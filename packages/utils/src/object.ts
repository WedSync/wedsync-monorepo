export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const cloned = {} as { [key: string]: any };
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone((obj as any)[key]);
    });
    return cloned as T;
  }
  return obj;
};

export const deepMerge = <T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T => {
  if (!sources.length) return target;
  const source = sources.shift();
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    });
  }
  
  return deepMerge(target, ...sources);
};

export const isObject = (item: any): item is Record<string, any> => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

export const isEmpty = (obj: any): boolean => {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

export const has = (obj: Record<string, any>, path: string): boolean => {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current == null || typeof current !== 'object' || !(key in current)) {
      return false;
    }
    current = current[key];
  }
  
  return true;
};

export const get = <T = any>(obj: Record<string, any>, path: string, defaultValue?: T): T => {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current == null || typeof current !== 'object' || !(key in current)) {
      return defaultValue as T;
    }
    current = current[key];
  }
  
  return current as T;
};

export const set = (obj: Record<string, any>, path: string, value: any): void => {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
};

export const unset = (obj: Record<string, any>, path: string): boolean => {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      return false;
    }
    current = current[key];
  }
  
  const lastKey = keys[keys.length - 1];
  if (lastKey in current) {
    delete current[lastKey];
    return true;
  }
  
  return false;
};

export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj } as Omit<T, K>;
  keys.forEach(key => {
    delete (result as any)[key];
  });
  return result;
};

export const invert = (obj: Record<string, string | number>): Record<string, string> => {
  const result: Record<string, string> = {};
  Object.keys(obj).forEach(key => {
    result[String(obj[key])] = key;
  });
  return result;
};

export const mapKeys = <T>(
  obj: Record<string, T>,
  mapper: (key: string, value: T) => string
): Record<string, T> => {
  const result: Record<string, T> = {};
  Object.keys(obj).forEach(key => {
    const newKey = mapper(key, obj[key]);
    result[newKey] = obj[key];
  });
  return result;
};

export const mapValues = <T, U>(
  obj: Record<string, T>,
  mapper: (value: T, key: string) => U
): Record<string, U> => {
  const result: Record<string, U> = {};
  Object.keys(obj).forEach(key => {
    result[key] = mapper(obj[key], key);
  });
  return result;
};

export const flatten = (obj: Record<string, any>, separator: string = '.'): Record<string, any> => {
  const result: Record<string, any> = {};
  
  const recurse = (current: any, prefix: string = '') => {
    Object.keys(current).forEach(key => {
      const value = current[key];
      const newKey = prefix ? `${prefix}${separator}${key}` : key;
      
      if (isObject(value) && !Array.isArray(value)) {
        recurse(value, newKey);
      } else {
        result[newKey] = value;
      }
    });
  };
  
  recurse(obj);
  return result;
};

export const unflatten = (obj: Record<string, any>, separator: string = '.'): Record<string, any> => {
  const result: Record<string, any> = {};
  
  Object.keys(obj).forEach(key => {
    set(result, key.replace(new RegExp(separator, 'g'), '.'), obj[key]);
  });
  
  return result;
};