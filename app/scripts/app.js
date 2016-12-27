(function (document) {
  let home = null;

  /**
   * Helper function to show the search query.
   * @param {String} response - The unparsed JSON response from get.
   */
  function addSearchHeader(response) {
    try {
      response = JSON.parse(response).query;
    } catch (e) {}
    home.innerHTML = `<h2 class="page-title">query: ${response}</h2>`;
  }

  /**
   * XHR wrapped in a promise.
   * @param  {String} url - The URL to fetch.
   * @return {Promise}    - A Promise that resolves when the XHR succeeds and fails otherwise.
   */
  function get(url) {
    return new Promise((resolve, reject) => {
      const req = new XMLHttpRequest();
      req.open('GET', url);
      req.onload = () => {
        if (req.status === 200) {
          resolve(req.response);
        } else {
          reject(Error(req.statusText));
        }
      };
      req.onerror = () => reject(Error('Network Error'));
      req.send();
    });
  }

  window.addEventListener('WebComponentsReady', () => {
    home = document.querySelector('section[data-route="home"]');
    get('../data/earth-like-results.json')
    .then(addSearchHeader)
    .catch((error) => {
      addSearchHeader('unknown');
      console.error(error);
    });
  });
})(document);
