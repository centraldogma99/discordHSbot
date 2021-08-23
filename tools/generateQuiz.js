/*
  FIXME 영역 고치기
  FIXME difficulty 구현
*/

const cropImage = require("./cropImage");

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function generateQuiz(imageURL, difficulty){
  // difficulty는 1~5까지의(임시) 정수. 클수록 잘린 이미지 사이즈가 작아짐.
  const size = 150 - 10*(difficulty-1)
  const left = getRandomInt(90, 130);
  const top = getRandomInt(90, 100);

  const processedImages = cropImage(imageURL, size, size, left, top);
  return processedImages;
}

module.exports = generateQuiz;