// The Info-Window View Model.

(function(global) {

  global.viewmodels = global.viewmodels || {};

  global.viewmodels.InfoWindow = InfoWindow;

  function InfoWindow(mainViewModel) {
    var self = this,
        document = global.document,
        map = global.map,
        placeInfo = global.placeInfo,
        ko = global.ko,
        infoCache = {},       // Cached information retrieved from third party APIs.
        infoLifetime = 1200,  // Seconds to wait before updating cached info.
        preChangeMarkerData,  // Used to restore the marker's state if editing is canceled.
        maxImageWidth = 450;  // Used to specify desired image dimensions in API requests.


    // Methods for changing the information source.
    self.changeSourceTo = {
      flickr: function() { changeSource('flickr'); },
      foursquare: function() { changeSource('foursquare'); },
      google: function() { changeSource('google'); },
      wikipedia: function() { changeSource('wikipedia'); }
    };

    // Closes the info window.
    self.close = function() {
      // Triggers an event that invokes the closing method.
      map.closeInfoWindow();
    };

    // Sets self.editing to true.
    self.edit = function() {
      self.editing(true);
    };

    // Whether or not the info-window is being used to edit the marker.
    self.editing = ko.observable(false);

    // The HTML string containing additional information.
    self.info = ko.observable('<p>Loading...</p>');

    // The marker the info-window is currently assigned to.
    self.marker = ko.observable();

    // Opens the info-window on the given marker.
    self.open = function(marker) {
      // Close the info-window if it's open.
      if (self.marker()) {
        self.close();
      }

      var content = createContent();

      self.marker(marker);
      self.refresh();
      map.setInfoWindowContent(content);
      map.openInfoWindow(marker.id());

      // Apply KO bindings to the newly created content.
      ko.applyBindings(self, content);

      /**
       * Creates content to be used in the map's info-window in the DOM.
       */
      function createContent() {
        var content = document.createElement('div');
        content.classList.add('info-window');

        // The view visible when not editing.
        var article = document.createElement('article');
        article.dataset.bind = 'visible: !editing()';
        article.innerHTML = '<div class="button-group">' +
                            '<button data-bind="click: edit">Modify</button>' +
                            '<button data-bind="click: remove">Remove</button>' +
                            '</div>' +
                            '<h1 data-bind="text: marker().title"></h1>' +
                            '<p data-bind="text: marker().description"></p>' +
                            '<h2 class="additional-info-sources">Information Sources</h2>' +
                            '<div class="button-group">' +
                            '<button data-bind="click: changeSourceTo.google, css: {\'selected-source\': source() === \'google\'}"><i class="fa fa-google"></i></button>' +
                            '<button data-bind="click: changeSourceTo.flickr, css: {\'selected-source\': source() === \'flickr\'}"><i class="fa fa-flickr"></i></button>' +
                            '<button data-bind="click: changeSourceTo.foursquare, css: {\'selected-source\': source() === \'foursquare\'}"><i class="fa fa-foursquare"></i></button>' +
                            '<button data-bind="click: changeSourceTo.wikipedia, css: {\'selected-source\': source() === \'wikipedia\'}"><i class="fa fa-wikipedia-w"></i></button>' +
                            '</div>' +
                            '<section class="additional-info" data-bind="html: info"></section>';

        // The view visible when editing.
        var form = document.createElement('form');
        form.classList.add('additional-info-form');
        form.dataset.bind = 'visible: editing, submit: update';
        form.innerHTML = '<label>Title<input type="text" data-bind="textInput: marker().title"></label>' +
                         '<label>Description<textarea data-bind="textInput: marker().description" rows="4"></textarea></label>' +
                         '<div class="button-group">' +
                         '<button data-bind="click: restore" type="button">Cancel</button>' +
                         '<button type="submit">Confirm</button>' +
                         '</div>';

        content.appendChild(article);
        content.appendChild(form);

        return content;
      }
    };

    // Refreshes the additional information.
    self.refresh = function() {
      var source = self.source(),
          markerID = self.marker().id(),
          place = self.marker().position(),
          cached = checkCache(source, source === 'google' ? markerID : JSON.stringify(place));

      // Clear the displayed info.
      self.info('<p>Loading...</p>');

      // Handle requests to placeInfo if it failed to initialize.
      if (!placeInfo && source !== 'google') {
        var dummyInfo = {
          place: place,  // The source isn't google, so place isn't the Google Place ID.
          source: source,
          results: []
        };

        infoReady(dummyInfo);
        return;
      }

      // Use cached info if not stale, otherwise get fresh info.
      if (cached) {
        infoReady(cached.info);
      } else {
        switch (source) {
          case 'google':
            map.getPlaceDetails(infoReady, markerID, {maxWidth: maxImageWidth});
            break;
          case 'flickr':
            placeInfo.sources.flickr(infoReady, place);
            break;
          case 'foursquare':
            placeInfo.sources.foursquare(infoReady, place);
            break;
          case 'wikipedia':
            placeInfo.sources.wikipedia(infoReady, place, {maxDimension: maxImageWidth});
            break;
        }
      }

      /**
       * Caches the additional information with a timestamp.
       * @param {object} info
       * @param {object|string} info.place - Either an object with lat and lng properties, or a Google Place ID.
       * @param {string} info.source - The source the additional information was retrieved from.
       * @param {object[]} info.results - The additional information.
       */
      function cacheInfo(info) {
        // Use an identifier created from the place property. (Small object or marker id.)
        var cacheIdentifier = typeof info.place === 'object' ? JSON.stringify(info.place) : info.place;

        // Ensure a cache exists for the source.
        infoCache[info.source] = infoCache[info.source] || {};

        // Add or replace the info in the cache.
        infoCache[info.source][cacheIdentifier] = {
          info: info,
          timestamp: Date.now()
        };
      }

      /**
       * Checks for cached info and returns it if found and not stale.
       * @param {string} source - The source of the information.
       * @param {string} identifier - The identifier the information would be stored under.
       * @returns - The cached info, or false.
       */
      function checkCache(source, identifier) {
        if (infoCache[source] && infoCache[source][identifier]) {
          var cachedInfo = infoCache[source][identifier],
              age = (Date.now() - cachedInfo.timestamp) / 1000;  // In seconds.

          // Check if the info is fresh.
          if (age < infoLifetime) {
            return cachedInfo;
          }
        }

        // Either no cached info, or stale cached info.
        return false;
      }

      /**
       * Formats the info into an HTML string and returns it.
       * @param {object} info
       * @param {object|string} info.place - Either an object with lat and lng properties, or a Google Place ID.
       * @param {string} info.source - The source the additional information was retrieved from.
       * @param {object[]} info.results - The additional information.
       * @returns - An HTML string intended for use in self.info.
       */
      function formatInfo(info) {
        var str = '<h1 class="additional-info-title">' + title() + '</h1>' +
                  '<div class="additional-info-results">' + results() + '</div>' +
                  '<footer class="additional-info-credit"><small>' + credit() + '</small></footer>';

        return str;

        function title() {
          switch (info.source) {
            case 'google':
              return 'Details From Google';
            case 'flickr':
              return 'Area Photos From Flickr';
            case 'foursquare':
              return 'Nearby Venues From Foursquare';
            case 'wikipedia':
              return 'Area Articles From Wikipedia';
            default:
              // The source wasn't identified.
              return '';
          }
        }

        function results() {
          // Handle missing results (also occcurs if data requests fail).
          if (!info.results.length) {
            return '<p>Nothing found.</p>';
          }

          switch (info.source) {
            case 'google':
              return info.results
                .map(function(result) {
                  // Sanitize name.
                  result.name = result.name.replace(/</g, '&lt;');

                  return '<div class="additional-info-result google-result">' +

                         // The result title.
                         '<h2 class="google-result-title">' +
                         (result.website ?
                           '<a href="' + result.website + '" target="_blank">' + result.name + '</a>' :
                           result.name) +
                         '</h2>' +

                         // The result details.
                         '<ul class="google-result-details">' +
                         // Address.
                         (result.address ?
                           '<li class="google-result-detail">' + result.address + '</li>' :
                           '') +
                         // Phone.
                         (result.internationalPhone ?
                           '<li class="google-result-detail">' + result.internationalPhone + '</li>' :
                           '') +
                         // Price.
                         (result.price ?
                           '<li class="google-result-detail">' + result.price + '</li>' :
                           '') +
                         // Rating.
                         (result.rating ?
                           '<li class="google-result-detail">' + result.rating + ' / 5</li>' :
                           '') +
                         // Google page.
                         (result.googlePage ?
                           '<li class="google-result-detail"><a href="' + result.googlePage + '" target="_blank">Google Page</a></li>' :
                           '') +
                         '</ul>' +

                         // The result photos.
                         (result.photos ?
                           '<h3>Photos</h3>' +
                           '<ul class="google-result-photos">' +
                           result.photos
                             .map(function(photo) {
                               return '<li class="google-result-photo-container">' +
                                      '<a href="' + photo.fullsize + '" target="_blank">' +
                                      '<img class="google-result-photo" src="' + photo.src + '">' +
                                      '</a>' +
                                      '<small>' + photo.attributions.join(' ') + '</small>' +
                                      '</li>';
                             })
                             .join('') +
                           '</ul>' :
                           '') +

                         // The result reviews.
                         (result.reviews ?
                           '<h3>Reviews</h3>' +
                           '<ul class="google-result-reviews">' +
                           result.reviews
                             .map(function(review) {
                               return '<li class="google-result-review">' +
                                      (review.author.profile ?
                                        '<a href="' + review.author.profile + '" target="_blank">' + review.author.name.replace(/</g, '&lt;') + '</a>' :
                                        review.author.name.replace(/</g, '&lt;')) +
                                      '<ul>' +
                                      review.aspects
                                        .map(function(aspect) {
                                          return '<li>' +
                                                 aspect.type + ': ' + aspect.rating + '/3' +
                                                 '</li>';
                                        })
                                        .join('') +
                                      '</ul>' +
                                      '<p>' + review.text + '</p>' +
                                      '</li>';
                             })
                             .join('') +
                           '</ul>' :
                           '') +

                         '</div>';
                })
                .join('');
            case 'flickr':
              return info.results
                .map(function(result) {
                  // Sanitize title and insert word breaks.
                  result.title = result.title.replace(/</g, '&lt;').replace(/#/g, '<wbr>#');

                  return '<div class="additional-info-result flickr-result">' +
                         '<h2 class="flickr-result-title">' + result.title + '</h2>' +
                         '<a href="' + result.url + '" target="_blank">' +
                         '<img class="flickr-result-photo" src="' + result.src + '">' +
                         '</a>' +
                         '</div>';
                })
                .join('');
            case 'foursquare':
              return info.results
                .map(function(result) {
                  // Sanitize name.
                  result.name = result.name.replace(/</g, '&lt;');

                  return '<div class="additional-info-result foursquare-result">' +

                         // The result title.
                         '<h2 class="foursquare-result-title">' +
                         (result.url ?
                           '<a href="' + result.url + '" target="_blank">' + result.name + '</a>' :
                           result.name) +
                         '</h2>' +

                         // The result details.
                         '<ul class="foursquare-result-details">' +
                         // Category.
                         (result.categories.length ?
                           '<li class="foursquare-result-detail">' + result.categories
                                            .filter(function(category) {
                                              if (category.hasOwnProperty('primary')) {
                                                return true;
                                              } else {
                                                return false;
                                              }
                                            })[0].name + '</li>' :
                           '') +
                         // Address.
                         (result.location.address ?
                           '<li class="foursquare-result-detail">' + result.location.address + '</li>' :
                           '') +
                         // Price.
                         (result.price ?
                           '<li class="foursquare-result-detail">Price: ' + result.price.message + '</li>' :
                           '') +
                         // Rating.
                         (result.rating ?
                           '<li class="foursquare-result-detail">' + result.rating + ' / 10</li>' :
                           '') +
                         // Attribution link.
                         '<li class="foursquare-result-detail"><a href="https://foursquare.com/v/' + result.id + '?ref=0V0DM3MNMWFDECB2ZTPOAB1XIZD1F14VFCIBLGJ1RJQD2C3V" target="_blank">' +
                         'More information...' +
                         '</a></li>' +
                         '</ul>' +

                         '</div>';
                })
                .join('');
            case 'wikipedia':
              return info.results
                .map(function(result) {
                  return '<div class="additional-info-result wikipedia-result">' +

                         // The result title.
                         '<h2 class="wikipedia-result-title">' +
                         (result.url ?
                           '<a href="' + result.url + '" target="_blank">' + result.title + '</a>' :
                           result.title) +
                         '</h2>' +

                         // The result thumbnail.
                         (result.thumbnail ?
                           '<img class="wikipedia-result-thumb" src="' + result.thumbnail.source + '">' :
                           '') +

                         // The result description.
                         (result.description ?
                           '<p class="wikipedia-result-description">' + result.description + '</p>' :
                           '') +

                         '</div>';
                })
                .join('');
            default:
              // The source wasn't identified.
              return '';
          }
        }

        function credit() {
          switch (info.source) {
            case 'google':
              return info.results
                      .map(function(result) {
                        return result.attributions;
                      })
                      .join(' ');
            case 'flickr':
              return 'Disclaimer: <q cite="https://www.flickr.com/services/api/tos/">This product uses the Flickr API but is not endorsed or certified by Flickr.</q>';
            case 'foursquare':
              return 'Results provided by <cite><a href="https://foursquare.com/">Foursquare</a></cite>.';
            case 'wikipedia':
              return 'Results provided by <cite><a href="https://www.wikipedia.org/">Wikipedia</a></cite>.';
            default:
              // The source wasn't identified.
              return '';
          }
        }

      }

      /**
       * Handles new additional information becoming available.
       * @callback infoReady
       * @param {object} info
       * @param {object|string} info.place - Either an object with lat and lng properties, or a Google Place ID.
       * @param {string} info.source - The source the additional information was retrieved from.
       * @param {object[]} info.results - The additional information.
       */
      function infoReady(info) {
        // Cache the info if it contains results.
        if (info.results.length) {
          cacheInfo(info);
        }

        // Abort if the user has changed the source or place since the info was requested.
        if ((info.source !== source) ||
            (info.place !== self.marker().id() && info.place !== self.marker().position())) {
          return;
        }

        // Create an HTML string from the info.
        var htmlStr = formatInfo(info);

        // Set info to the HTML string.
        self.info(htmlStr);
      }
    };

    // Removes the marker.
    self.remove = function() {
      // Cache the marker because it gets set to null when the info-window closes.
      var marker = self.marker();

      self.close();
      mainViewModel.removeMarker(marker);
    };

    // Restores the marker to its cached state.
    self.restore = function() {
      // If there is no cached data, abort.
      if (!preChangeMarkerData) {
        console.warn('Could not restore marker, no cached data found.');
        self.editing(false);
        return;
      }

      self.marker().title(preChangeMarkerData.title);
      self.marker().description(preChangeMarkerData.description);
      self.editing(false);
    };

    // The source of the additional information. Possible valuse are 'google', 'flickr', 'foursquare', and 'wikipedia'.
    self.source = ko.observable('google');

    // Updates the marker with the new data, then reopens the info-window.
    self.update = function() {
      // Finish editing.
      self.editing(false);

      // Cache the marker because it gets set to null when the info-window closes.
      var marker = self.marker();

      // Close the info-window, recreate the marker, reopen the info-window.
      self.close();
      mainViewModel.createOrRecreateMarker(marker);
      self.open(marker);

      // Save the changes.
      mainViewModel.saveMarkers();
    };

    init();

    /**
     * Caches marker data if editing is true, otherwise uncaches it.
     * @param {boolean} editing
     */
    function cacheMarkerData(editing) {
      if (editing) {
        preChangeMarkerData = ko.toJS(self.marker());
      } else {
        preChangeMarkerData = null;
      }
    }

    /**
     * Changes the information source.
     * @param {string} newSource - The new information source.
     */
    function changeSource(newSource) {
      if (self.source() !== newSource) {
        self.source(newSource);
        self.refresh();
      }
    }

    /**
     * Invoked when the map closes the info-window.
     */
    function closing() {
      // Undo in-progress edits.
      if (self.editing()) {
        self.restore();
        self.editing(false);
      }

      // Clear the info-window's DOM content. (Otherwise KO data-bindings will throw errors because the marker will be set to null.)
      map.getInfoWindowContent().innerHTML = '';

      // Clear the assigned marker.
      self.marker(null);
    }

    /**
     * Initializes the info-window view model.
     */
    function init() {
      // Add an event listener to the event fired when the map closes the info-window.
      map.onInfoWindowClose(closing);
      // Subscribe cacheMarkerData to the editing state.
      self.editing.subscribe(cacheMarkerData);
    }
  }

})(this);
