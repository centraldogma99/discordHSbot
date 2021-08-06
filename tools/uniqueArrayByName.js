function uniqueArrayByName(array) {
  let seen = {};
  return array.filter( item => {
    return seen.hasOwnProperty(item.name) ? false : (seen[item.name] = true);
  })
}

module.exports = uniqueArrayByName;