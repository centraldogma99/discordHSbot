import stringsKor from "./kor/search.json"
import stringsEng from "./eng/search.json"
import { parseLang } from "./parseLang"

const loadLang = (language: string,
  korLangSet?: { name: string, string: string }[],
  engLangSet?: { name: string, string: string }[]) => {
  return language === 'ko_KR' ?
    parseLang(korLangSet ?? stringsKor) :
    parseLang(engLangSet ?? stringsEng);
}

export default loadLang;