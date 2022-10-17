export function patchStyle(el: HTMLElement, prev, next) {
  for (const key in next) {
    el.style[key] = next[key];
  }
  if (prev) {
    for (const key in prev) {
      if (next[key] == null) {
        el.style[key] = null;
      }
    }
  }
}
