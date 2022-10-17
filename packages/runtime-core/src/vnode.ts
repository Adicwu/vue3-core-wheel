import { isArray, isObject, ShapeFlags } from "@avue/shared";

export const Text = Symbol("text");

export function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}

export function createVnode(type, props, children = null) {
  const shapeFlag =
    typeof type === "string"
      ? ShapeFlags.ELEMENT
      : isObject(type)
      ? ShapeFlags.COMPONENT
      : 0;
  const vnode = {
    type,
    props,
    children,
    el: null,
    key: props?.key,
    __v_isVnode: true,
    shapeFlag,
    component: null,
    template: null,
  };
  normalizeChildren(vnode, children);
  return vnode;
}

function normalizeChildren(vnode, children) {
  let type = 0;
  if (children == null) {
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN;
  } else {
    children = String(children);
    type = ShapeFlags.TEXT_CHILDREN;
  }
  vnode.shapeFlag |= type;
}
