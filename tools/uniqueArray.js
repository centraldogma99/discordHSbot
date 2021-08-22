function uniqueArray(array, element) {
  let seen = {};
  return array.filter( item => {
    return seen.hasOwnProperty(item[element]) ? false : (seen[item[element]] = true);
  })
}

module.exports = uniqueArray;