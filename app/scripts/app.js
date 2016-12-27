(function(document) {
  let home = null;

  /**
   * Helper function to show the search query.
   * @param {String} query - The search query.
   */
  function addSearchHeader(query) {
    home.innerHTML = `<h2 class="page-title">query: ${query}</h2>`;
  }

  /**
   * XHR wrapped in a Promise using Fetch.
   * @param  {String} url - The URL to fetch.
   * @return {Promise}    - A Promise that resolves when the XHR succeeds and fails otherwise.
   */
  function get(url) {
    return fetch(url);
  }

  /**
   * Performs an XHR for a JSON and returns a parsed JSON response.
   * @param  {String} url - The JSON URL to fetch.
   * @return {Promise}    - A promise that passes the parsed JSON response.
   */
  function getJSON(url) {
    return get(url).then(response => response.json());
  }

  window.addEventListener('WebComponentsReady', () => {
    home = document.querySelector('section[data-route="home"]');
    getJSON('../data/earth-like-results.json')
    .then((response) => {
      addSearchHeader(response.query);
      console.log(response);
    })
    .catch((err) => {
      addSearchHeader('unknown');
      console.error(err);
    });
  });
})(document);
