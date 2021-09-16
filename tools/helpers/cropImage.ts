const sharp = require('sharp');
const getImage = require('./getImage')

export async function cropImage(imageURL, width, height, left, top){
  let image = await getImage(imageURL);
  const croppedImage = await new sharp(image).extract({
    width: width,
    height: height,
    left: left,
    top: top
  }).toBuffer()
  return {
    croppedImage: croppedImage,
    originalImage: image
  }
}