import axios from "axios";

export default async function getImage(imageURL: string) {
  let res = await axios({
    url: imageURL,
    responseType: "arraybuffer",
  })
  return res.data;
}
