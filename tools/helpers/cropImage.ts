import sharp from 'sharp';
import { getImage } from './getImage';

export async function cropImage(
  imageURL: string,
  width: number,
  height: number,
  left: number,
  top: number
) {
  let image = await getImage(imageURL);
  const croppedImage = await sharp(image).extract({
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