import { hasOwn } from "@avue/shared";

export const PublicInstanceProxyHandlers: ProxyHandler<any> = {
  get({ _: instance }, k) {
    const { setupState, props, data } = instance;
    if (k[0] === "$") return;
    if (hasOwn(setupState, k)) {
      return setupState[k];
    } else if (hasOwn(props, k)) {
      return props[k];
    } else if (hasOwn(data, k)) {
      return data[k];
    } else {
      return undefined;
    }
  },
  // set({ _: instance }, k, v) {
  //   console.log("set");

  //   return false;
  // },
};
