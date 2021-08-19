const axios = require('axios');
const sharp = require('sharp');

async function mergeImages(imageURLs, cardsPerLine=3){
  if( imageURLs.length == 0 ){
    return;
  }
  if( imageURLs.length <= cardsPerLine ){
    const files = await Promise.all(imageURLs.slice(1).map(url => 
      axios({
        url: url,
        responseType: "arraybuffer"
      })
      .then(res => res.data)
    ))
  
    const base = axios({
      url: imageURLs[0],
      responseType: "arraybuffer"
    })
    .then(res => res.data);
  
    let composite = files.reduce( (input, overlay) => 
      input.then(
        data => 
          sharp(data)
          .extend({
            right: 375,
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .composite([{ input: overlay, gravity: 'east' }])
          .toBuffer()
      )
    , base);
    return composite;
  } else if(imageURLs.length > cardsPerLine) {
    const secondLineHeight = Math.ceil((imageURLs.length - cardsPerLine)/cardsPerLine);
    // 둘다 버퍼
    const firstline = await mergeImages(imageURLs.slice(0,cardsPerLine), cardsPerLine);
    const secondline = await mergeImages(imageURLs.slice(cardsPerLine), cardsPerLine);
    let res = sharp(firstline)
    .extend({
      bottom: 518 * secondLineHeight,
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .composite([{ input: secondline, gravity: 'southwest' }])
    .toBuffer()

    return res;
  }
}

module.exports = mergeImages;