const axios = require('axios');

function getImage(imageURL){
  let image = axios({ 
    url: imageURL,
    responseType: "arraybuffer"
  })
  .then(res => res.data);

  return image;
}

module.exports = getImage;