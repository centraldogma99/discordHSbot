export const parseLang = (arr: { name: string, string: string }[]) => {
  return (name: string) => {
    return arr.filter(e => e.name === name)[0].string;
  }
}

export const parseLangArr = (arr: { name: string, strings: string[] }[]) => {
  return (name: string) => {
    return arr.filter(e => e.name === name)[0].strings;
  }
}

export default parseLang;