require("dotenv").config()
const axios = require("axios");
const CONSTANTS = require('../constants')

class BlizzardToken{
  static token;
  static refreshTime;
  static async getToken(){
    if(!this.token || Math.floor(Date.now()/1000) - this.refreshTime > 80000){
      const blizzardID = process.env.BLIZZARD_ID;
      const blizzardSecret = process.env.BLIZZARD_SECRET;
      try{
        let res = await axios({
          url : `https://${ CONSTANTS.apiRequestRegion }.battle.net/oauth/token`,
          method : "post",
          auth: {
            username : blizzardID,
            password : blizzardSecret
          },
          data: new URLSearchParams({
            grant_type: 'client_credentials'
          })
        })
        this.token = res.data.access_token;
        this.refreshTime = Math.floor(Date.now()/1000);
        console.log("battle.net token refreshed")
        return this.token;
      } catch(e){
        console.error(e);
      }
    } else {
      return this.token;
    }
  }
}

module.exports = BlizzardToken;