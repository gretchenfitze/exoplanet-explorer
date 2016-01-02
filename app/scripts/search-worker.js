'use strict';

/* jshint unused: false */

// http://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
function clone(obj) {
  var copy;

  // Handle the 3 simple types, and null or undefined
  if (null === obj || 'object' !== typeof obj) { return obj; }

  // Handle Array
  if (obj instanceof Array) {
    copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      copy[i] = clone(obj[i]);
    }
    return copy;
  }

  // Handle Object
  if (obj instanceof Object) {
    copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) { copy[attr] = clone(obj[attr]); }
    }
    return copy;
  }

  throw new Error('Unable to copy object! Its type isn\'t supported.');
}

// match what the homepage sliders say
var queryPairings = {
  radius: {
    '0': {
      specific: -1
    },
    '1': {
      lower: 0,
      upper: 2
    },
    '2': {
      lower: 2,
      upper: 7
    },
    '3': {
      lower: 7,
      upper: -1
    }
  },
  mass: {
    '0': {
      specific: -1
    },
    '1': {
      lower: 0,
      upper: 2
    },
    '2': {
      lower: 2,
      upper: 100
    },
    '3': {
      lower: 100,
      upper: -1
    }
  },
  distance: {
    '0': {
      specific: -1
    },
    '1': {
      lower: 0,
      upper: 20
    },
    '2': {
      lower: 20,
      upper: 1000
    },
    '3': {
      lower: 1000,
      upper: -1
    }
  },
  temperature: {
    '0': {
      specific: -1
    },
    '1': {
      lower: 0,
      upper: 200
    },
    '2': {
      lower: 200,
      upper: 330
    },
    '3': {
      lower: 330,
      upper: 700
    },
    '4': {
      lower: 700,
      upper: -1
    }
  }
};

/**
 * Creates the params for the specific search from sliders.
 * @param  {String} queryString In the URL created by the sliders
 * @return {Object}             The params for specific searches.
 */
function handleSlidersQuery(queryString) {
  // queryString > queryParts > parts > pieces
  var params = [];
  queryString = JSON.parse(queryString.replace('s=', ''));

  // matches the slider query with the pairings above
  for (var q in queryString) {
    var param = {
      field: q
    };
    var values = queryPairings[q][queryString[q]];
    for (var r in values) {
      param[r] = values[r];
    }
    params.push(param);
  }

  return params;
}

/**
 * Creates the params for the specific search from custom entry.
 * @param  {String} queryString The custom search
 * @return {Object}             The params for specific searches.
 */
function handleCustomQuery(queryString) {
  // queryString eg: distance 10 20, mass 1 3
  // distance between 10 and 20 ly and mass between 1 and 3 masse
  var params = [];
  queryString = JSON.parse(queryString.replace('q=', ''));
  // split on commas
  // split result on spaces
  // if known field and 1 value, specific
  // if known field and 2 values, lower and upper
  // search differently whether numbers or strings
  // need to smartly parse strings - remove punctuation and spaces

  var queryParts = queryString.split(',');
  queryParts.forEach(function (part) {
    var pieces = part.replace(/\W+/g, ' ').split(' ');

    if (pieces.length === 2) {
      params.push({
        field: pieces[0],
        specific: pieces[1]
      });
    } else if (pieces.length === 3) {
      params.push({
        field: pieces[0],
        lower: pieces[1],
        upper: pieces[2]
      });
    }
  });
  return params;
}

// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers#Example_2_Advanced_passing_JSON_Data_and_creating_a_switching_system
var queryableFunctions = {
  query: function(queryString) {

    if (!queryString || typeof queryString !== 'string') {
      reply('returnedQuery', {nosearch: true});
      return;
    }

    // query payload
    var params = {};
    var type = 'byField';

    try {
      if (queryString.indexOf('s=') === 0) {
        // made with sliders
        params = handleSlidersQuery(queryString);
      } else if (queryString.indexOf('q=') === 0) {
        // it's custom
        params = handleCustomQuery(queryString);
      }
    } catch (e) {
      // if something is misformed with the payload, just search all fields
      // TODO: for numbers, create a range that's +/- 10?
      type = 'general';
      queryString = queryString.replace('q=', '');
      params = {
        specific: queryString
      };
    }

    db.makeRequest(type, params).then(function(planets) {
      reply('returnedQuery', planets);
    })
    .catch(function(e) {
      console.log(e);
      reply('returnedQuery', {error: true});
    });
  },
  getPlanetByName: function(name) {
    if (!name || typeof name !== 'string') {
      reply('gotPlanetByName', {noname: true});
      return;
    }
    db.makeRequest('name', {name: name}).then(function(planet) {
      reply('gotPlanetByName', planet);
    }).catch(function() {
      reply('gotPlanetByName', {error: true});
    });
  }
};

function defaultQuery (vMsg) {
  throw new Error('Search Worker - Missing query.');
}

function reply (/* listener name, argument to pass 1, argument to pass 2, etc. etc */) {
  if (arguments.length < 1) {
    throw new TypeError('reply - not enough arguments');
  }
  postMessage({'vo42t30': arguments[0],'rnb93qh': Array.prototype.slice.call(arguments, 1)});
}

onmessage = function (oEvent) {
  if (oEvent.data instanceof Object && oEvent.data.hasOwnProperty('bk4e1h0') && oEvent.data.hasOwnProperty('ktp3fm1')) {
    queryableFunctions[oEvent.data.bk4e1h0].apply(self, oEvent.data.ktp3fm1);
  } else {
    defaultQuery(oEvent.data);
  }
};

function Database() {
  var self = this;

  // master database
  var database = [];

  // planet indexes in master database
  var nameIndex = {};

  // state variables
  var dataReceived = false;
  var searchReady = false;
  var requestError = false;
  var fireSearchReady = function() {};
  var fireParsingFailed = function() {};

  // methods
  this._ready = function() {
    return new Promise(function(resolve, reject) {
      if (searchReady) {
        resolve();
      } else {
        fireSearchReady = resolve;
        fireParsingFailed = reject;
      }
    });
  };
  this._requestOnePlanet = function(name) {
    name = name.replace(/ /g, '');
    return getJSON('/data/planets/' + name + '.json');
  };
  this._reqByName = function(name) {
    var self = this;
    if (!name) { throw new TypeError('Database - getPlanetByName needs a name'); }

    return new Promise(function(resolve, reject) {
      if (searchReady) {
        var planet = database[nameIndex[name]];
        if (planet) {
          // got the data
          resolve(planet.data);
        } else {
          // planet isn't in database
          reject();
        }
      } else {
        // db isn't ready so send a request for the specific planet
        reject();
      }
    })
    .catch(function() {
      return self._requestOnePlanet(name);
    })
    .catch(function(e) {
      // can't find the planet at all
      return {missing: true};
    });
  };
  this._indexPlanet = function(planetData) {
    var planetName = planetData.pl_name;

    var distance = null;
    if (planetData.st_dist) {
      distance = planetData.st_dist * 3.26;
    }

    var radius = null;
    if (planetData.pl_rade) {
      radius = planetData.pl_rade;
    } else if (planetData.pl_radj) {
      radius = planetData.pl_radj * 11.2;
    }

    var mass = null;
    if (planetData.pl_masse) {
      mass = Number(planetData.pl_masse);
    } else if (planetData.pl_massj) {
      mass = Number(planetData.pl_massj) * 317.8;
    }

    // TODO: use pl_dens
    var density = null;
    if (radius && mass) {
      density = mass / ((4 / 3) * (Math.PI) * (radius * radius * radius));
    }

    var temperature = null;
    if (planetData.pl_eqt) {
      temperature = Number(planetData.pl_eqt);
    }

    var facility = null;
    if (planetData.pl_facility) {
      facility = planetData.pl_facility;
    }

    var telescope = null;
    if (planetData.pl_telescope) {
      telescope = planetData.pl_telescope;
    }

    var method = null;
    if (planetData.pl_discmethod) {
      method = planetData.pl_discmethod;
    }

    database.push({
      name: planetName,
      data: planetData,
      distance: distance,
      temperature: temperature,
      mass: mass,
      radius: radius
    });
    nameIndex[planetName] = database.length - 1;
  };
  this._init = function() {
    function request() {
      return getJSON('/data/data.json').then(function(planets) {
        dataReceived = true;
        return planets;
      });
    }
    request().catch(function() {
      // try it one more time
      return request();
    })
    .then(self._prepDatabase)
    .catch(function() {
      requestError = true;
      throw new Error('Database - Cannot retrieve database.');
    });
  };
  this._prepDatabase = function(planets) {
    planets.forEach(function(planet) {
      self._indexPlanet(planet);
    });

    searchReady = true;
    fireSearchReady();
  };

  /**
   * [makeRequest description]
   * @param  {String} type   One of 'name', 'queryGeneral', 'querySpecific'
   * @param  {[type]} params [description]
   * @return {[type]}        [description]
   */
  this.makeRequest = function(type, params) {
    // prep for search request
    var req = function() {};

    function exists(value) {
      if (value !== undefined) {
        return true;
      } else {
        return false;
      }
    }

    function getTypeOfComparison(param) {
      if (exists(param.lower) && exists(param.upper) && exists(param.specific)) {
        throw new Error('Database - Cannot have specific and range search parameters.');
      } else if (exists(param.lower) && exists(param.upper)) {
        return 'range';
      } else if (param.specific === -1) {
        return 'any';
      } else if (exists(param.specific) && typeof param.specific === 'string') {
        return 'specific-string';
      } else if (exists(param.specific) && typeof param.specific === 'number') {
        return 'specific-number';
      } else {
        return 'any';
      }
    }

    function compareValueToParam(typeOfComparison, planetValue, param) {
      var isMatch = false;
      switch (typeOfComparison) {
        case 'range':
          if (param.upper === -1 && planetValue >= param.lower) {
            isMatch = true;
          } else if (planetValue >= param.lower && planetValue <= param.upper) {
            isMatch = true;
          } else {
            isMatch = false;
          }
          break;
        case 'specific-string':
          if (typeof param.specific !== 'string') {
            param.specific = param.specific.toString();
          }
          var re = new RegExp('.*' + param.specific + '.*', 'i');
          if (planetValue.match(re)) {
            isMatch = true;
          } else {
            isMatch = false;
          }
          break;
        case 'specific-number':
          if (Math.round(planetValue) === Math.round(param.specific)) {
            isMatch = true;
          } else {
            isMatch = false;
          }
          break;
        case 'any':
          isMatch = true;
          break;
        default:
          throw new Error('Database - Unknown match type.');
          break;
      }
      return isMatch;
    }

    function searchAllFields(planet, param) {
      var isHit = false;
      var typeOfComparison = 'specific-string';

      // check the values that are added with indexing
      for (var field in planet) {
        if (planet.hasOwnProperty(field) && field !== 'data' && !isHit) {
          var planetValue = planet[field]
          if (planetValue) {
            planetValue = planetValue.toString();
            isHit = compareValueToParam(typeOfComparison, planetValue, param);
          } else {
            isHit = false;
          }
        }
      }

      // check the raw data
      for (var field in planet.data) {
        if (planet.data.hasOwnProperty(field) && !isHit) {
          var planetValue = planet.data[field]
          if (planetValue) {
            planetValue = planetValue.toString();
            isHit = compareValueToParam(typeOfComparison, planetValue, param);
          } else {
            isHit = false;
          }
        }
      }

      if (isHit) {
        var result = clone(planet);
        return result;
      } else {
        return null;
      }
    }

    function searchSpecificFields(planet, params) {
      var isHit = false;
      var score = 0;

      params.forEach(function (param, index) {
        // if the planet is already not a match after the first param, then skip
        if (index > 0 && !isHit) { return; }

        var typeOfComparison = getTypeOfComparison(param);

        // use the computed value before using the raw data
        // NOTE! planet.distance is mesaured in ly, planet.data.st_dist
        // is measured in pc
        var planetValue = planet[param.field] || planet.data[param.field];

        // the planet doesn't have data for this parameter
        if (!planetValue && typeOfComparison !== 'any') {
          isHit = false;
          return;
        }

        isHit = compareValueToParam(typeOfComparison, planetValue, param);
        if (isHit) { score += 1; }
      });

      if (isHit) {
        var result = clone(planet);
        result.score = score;
        return result;
      } else {
        return null;
      }
    }

    // create the search request
    if (arguments.length !== 2) { throw new Error('Database - ' + arguments.length + ' request arguments received. 2 expected.'); }
    switch (type) {
      case 'name':
        req = function() {
          try {
            return self._reqByName(params.name);
          } catch (e) {
            throw new TypeError('Database - getByName request missing name string.');
          }
        };
        break;
      case 'general':
        req = function() {
          return self._ready().then(function() {
            var results = [];
            // there's only 1 parameter
            var param = params;
            database.forEach(function(planet) {
              var hit = searchAllFields(planet, param);
              if (hit) { results.push(hit); }
            });
            results.sort(function(a, b) {
              return b.data.pl_name > a.data.pl_name;
            });
            return results;
          })
          .catch(function(e) {
            throw new Error('Database - General search error.');
          });
        };
        break;
      case 'byField':
        req = function() {
          return self._ready().then(function() {
            var results = [];
            database.forEach(function(planet) {
              var hit = searchSpecificFields(planet, params);
              if (hit) { results.push(hit); }
            });
            results.sort(function(a, b) {
              return b.score - a.score;
            });
            return results;
          })
          .catch(function(e) {
            throw new Error('Database - Field search error.');
          });
        };
        break;
      default:
        throw new TypeError('Database - unknown request type: ' + type + '.');
    }

    // give back the search request
    return new Promise(function(resolve) {
      if (requestError) {
        reject();
      } else {
        resolve(req());
      }
    });
  };

  // init the database as soon as the Database is constructed
  this._init();
}

var db = new Database();

function get(url) {
  // Return a new promise.
  return new Promise(function(resolve, reject) {
    // Do the usual XHR stuff
    var req = new XMLHttpRequest();
    req.open('GET', url);

    req.onload = function() {
      // This is called even on 404 etc
      // so check the status
      if (req.status === 200) {
        // Resolve the promise with the response text
        resolve(req.response);
      } else {
        // Otherwise reject with the status text
        // which will hopefully be a meaningful error
        reject(Error(req.statusText));
      }
    };

    // Handle network errors
    req.onerror = function() {
      reject(Error('Network Error'));
    };

    // Make the request
    req.send();
  });
}

function getJSON(url) {
  return get(url).then(JSON.parse).catch(function() {
    throw new Error('AJAX Error');
  });
}