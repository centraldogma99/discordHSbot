import axios from "axios";

export function getImage(imageURL: string) {
  let image = axios({
    url: imageURL,
    responseType: "arraybuffer",
  })
    .then((res) => res.data)
    .catch((e) => {
      console.log(e);
    });

  return image;
}
