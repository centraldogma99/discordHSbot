const sharp = require('sharp');

function cropImage(image){
  return sharp(image).extract({
    width: 100,
    height: 100,
    left: 60,
    top: 40
  }).toBuffer()
}

module.exports = cropImage;