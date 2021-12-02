import { userModel } from "../db";
// id is guaranteed to exist
export default async function giveUserPoint(id: number | string, point: number) {
  const userQuery = userModel.findOne({ id: id });
  const user = await userQuery.exec();
  if (!user) return;
  return await user
    .updateOne({ $set: { ["stats.point"]: user.stats.point + point } })
    .exec();
}
