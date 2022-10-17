import { createVnode } from "./vnode";

export function createAppAPI(render) {
  return function createApp(rootComponent, rootProps) {
    const app = {
      _props: rootProps,
      _component: rootComponent,
      _container: null,
      mount(container) {
        const vnode = createVnode(rootComponent, rootProps);
        render(vnode, container);

        app._container = container;
      },
    };
    return app;
  };
}
