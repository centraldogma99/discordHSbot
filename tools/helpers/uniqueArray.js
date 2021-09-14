function uniqueArray(array, element) {
  let seen = {};
  if (!element){
    return array.filter( item => {
      return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    })
  }
  return array.filter( item => {
    return seen.hasOwnProperty(item[element]) ? false : (seen[item[element]] = true);
  })
}

module.exports = uniqueArray;