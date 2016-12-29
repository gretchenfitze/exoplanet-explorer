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
   * Helper function to create a planet thumbnail.
   * @param  {Object} data - The raw data describing the planet.
   */
  function createPlanetThumb(data) {
    let pT = document.createElement('planet-thumb');
    for (let d in data) {
      pT[d] = data[d];
    }
    home.appendChild(pT);
  }

  /**
   * XHR wrapped in a promise
   * @param  {String} url - The URL to fetch.
   * @return {Promise}    - A Promise that resolves when the XHR succeeds and fails otherwise.
   */
  function get(url) {
    return fetch(url, {
      method: 'get',
    });
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
        return getJSON(response.results[0]);
      })
      .catch(() => {
        throw new Error('Search Request Error');
      })
      .then(createPlanetThumb)
      .catch((err) => {
        addSearchHeader('unknown');
        console.error(err)
      })
  });
})(document);
