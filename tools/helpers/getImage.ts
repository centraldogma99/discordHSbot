const axios = require('axios');

export function getImage(imageURL){
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