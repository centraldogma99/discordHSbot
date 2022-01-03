export const parseLang = (arr: { name: string, string: string }[]) => {
  return (name: string) => {
    const a = arr.filter(e => e.name === name);
    if (a.length == 0) return "언어 파일 문제!";
    return a[0].string;
  }
}

export const parseLangArr = (arr: { name: string, strings: string[] }[]) => {
  return (name: string) => {
    return arr.filter(e => e.name === name)[0].strings;
  }
}

export default parseLang;