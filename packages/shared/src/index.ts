export const isObject = <T>(e: T) => typeof e === "object" && e !== null;
export const isFunction = <T>(e: T) => typeof e === "function";
export const isArray = <T>(e: T) => e instanceof Array;
