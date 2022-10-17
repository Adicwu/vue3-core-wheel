export function patchAttr(el: HTMLElement, key: string, v) {
  if (v) {
    el.setAttribute(key, v);
  } else {
    el.removeAttribute(key);
  }
}
