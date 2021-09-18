import mongo from '../db';
// id is guaranteed to exist
export async function giveUserPoint(id: number | string, point: number){
  const userQuery = mongo.userModel.findOne({ id: id })
  try {
    const user = await userQuery.exec();
    return await userQuery.updateOne({ $set: { ["stats.point"]: user.stats.point + point } }).exec();
  } catch (e) {
    throw e;
  }
}