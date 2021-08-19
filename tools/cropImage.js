const sharp = require('sharp');
const axios = require('axios')

async function cropImage(imageURL){
  let image = (await axios({ 
    url: imageURL,
    responseType: "arraybuffer"
  })).data;
  return sharp(image).extract({
    width: 100,
    height: 100,
    left: 60,
    top: 40
  }).toBuffer()
}

module.exports = cropImage;