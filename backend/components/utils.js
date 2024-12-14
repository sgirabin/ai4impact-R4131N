function getVideoId(url) {
  return url.split('v=')[1];
}

module.exports = { getVideoId };
