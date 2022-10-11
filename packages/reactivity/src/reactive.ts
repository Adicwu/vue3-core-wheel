import { isObject } from "@avue/shared";
import { track, trigger } from "./effect";

const reactiveMap = new WeakMap();

enum ReactiveFlags {
  IS_REACTIVE = "_v_isReactive",
}

export function isReactive<T>(v: T) {
  return !!(v && v[ReactiveFlags.IS_REACTIVE]);
}
export const reactive = <T extends object>(target: T) => {
  if (!isObject(target)) {
    return target;
  }
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }
  const itx = reactiveMap.get(target);
  if (itx) {
    return itx;
  }

  return new Proxy(target, {
    get(t, k, rec) {
      if (k === ReactiveFlags.IS_REACTIVE) {
        return true;
      }

      track(t, "get", k);

      const res = Reflect.get(t, k, rec);
      if (isObject(res)) {
        return reactive(res);
      }

      return res;
    },
    set(t, k, v, rec) {
      const oldV = t[k];
      const res = Reflect.set(t, k, v, rec);
      if (oldV !== v) {
        trigger(t, "set", k);
      }
      return res;
    },
  });
};
