function getPromiseCallback(resolve, reject) {
  return (err) => {
    if (err) return reject(err);
    return resolve();
  }
}

function wrap(fn) {
  return new Promise((resolve, reject) => {
    fn(getPromiseCallback(resolve, reject))
  });
}

module.exports = wrap;
