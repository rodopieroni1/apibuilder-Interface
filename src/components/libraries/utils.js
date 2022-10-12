export const capitalize = (string) => {
    if (typeof string !== 'string') return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
export const isObject = (obj) => {
  if (Object.prototype.toString.call(obj) === '[object Object]') return true;
  return false;
}