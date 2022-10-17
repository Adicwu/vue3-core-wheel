import { nodeOps } from "./indexOps";
import { patchProp } from "./patchProp";
import { createRenderer } from "@avue/runtime-core";

export * from "@avue/runtime-core";
export * from "@avue/reactivity";

const rederOptions = Object.assign(nodeOps, {
  patchProp,
});

export const render = (vnode, container) => {
  return createRenderer(rederOptions).render(vnode, container);
};
export const createApp = (component, props) => {
  const app = createRenderer(rederOptions).createApp(component, props);
  const { mount } = app;
  app.mount = function (container) {
    container = nodeOps.querySelector(container);
    container.innerHTML = "";
    mount(container);
  };
  return app;
};

export type RederOptions = typeof rederOptions;
