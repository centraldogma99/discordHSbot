export function cho_hangul(str: string) {
  let cho = [
    "ㄱ",
    "ㄲ",
    "ㄴ",
    "ㄷ",
    "ㄸ",
    "ㄹ",
    "ㅁ",
    "ㅂ",
    "ㅃ",
    "ㅅ",
    "ㅆ",
    "ㅇ",
    "ㅈ",
    "ㅉ",
    "ㅊ",
    "ㅋ",
    "ㅌ",
    "ㅍ",
    "ㅎ",
  ];
  let result = "";
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i) - 44032;
    if (code > -1 && code < 11172) result += cho[Math.floor(code / 588)];
    else {
      let chr = str.charAt(i);
      // if(!isNaN(chr)){
      //   if( chr == '1' || chr == '2' || chr == '5' || chr == '6' ){
      //     chr = 'ㅇ';
      //   } else if (chr == '3' || chr == '4'){
      //     chr = 'ㅅ';
      //   } else if (chr == '7'){
      //     chr = 'ㅊ';
      //   } else if (chr == '8'){
      //     chr = 'ㅍ';
      //   } else if (chr == '9'){
      //     chr = 'ㄱ';
      //   }
      // }
      result += chr;
    }
  }
  return result;
}
