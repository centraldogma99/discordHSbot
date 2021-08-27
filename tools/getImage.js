const axios = require('axios');

function getImage(imageURL){
  let image = axios({ 
    url: imageURL,
    responseType: "arraybuffer"
  })
  .then(res => res.data)
  .catch((e) =>{
    console.log(e);
  });

  return image;
}

module.exports = getImage;