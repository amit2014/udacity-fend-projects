/**
 * app.js
 * Core functionality for the Cat Clicker application.
 */

(function(global) {
  var model = {
    init: function() {
      if (!global.window.localStorage.getItem('clicks')) {
        var clicks = {};
        var cats = this.getAllCats();

        for (var catID in cats) {
          clicks[catID] = 0;
        }

        global.window.localStorage.setItem('clicks', JSON.stringify(clicks));
      }
    },

    getAllCats: function() {
      return {
        1: {
          id: 1,
          name: 'Killit',
          images: [
            {
              width: '1920w',
              url: 'image/cat-1.jpg'
            },
            {
              width: '960w',
              url: 'image/960x635/cat-1-960x635.jpg'
            },
            {
              width: '480w',
              url: 'image/480x318/cat-1-480x318.jpg'
            }
          ]
        },
        2: {
          id: 2,
          name: 'Scratchit',
          images: [
            {
              width: '1920w',
              url: 'image/cat-2.jpg'
            },
            {
              width: '960w',
              url: 'image/960x635/cat-2-960x635.jpg'
            },
            {
              width: '480w',
              url: 'image/480x318/cat-2-480x318.jpg'
            }
          ]
        },
        3: {
          id: 3,
          name: 'Watchit',
          images: [
            {
              width: '1920w',
              url: 'image/cat-3.jpg'
            },
            {
              width: '960w',
              url: 'image/960x635/cat-3-960x635.jpg'
            },
            {
              width: '480w',
              url: 'image/480x318/cat-3-480x318.jpg'
            }
          ]
        },
        4: {
          id: 4,
          name: 'Pounceonit',
          images: [
            {
              width: '1920w',
              url: 'image/cat-4.jpg'
            },
            {
              width: '960w',
              url: 'image/960x635/cat-4-960x635.jpg'
            },
            {
              width: '480w',
              url: 'image/480x318/cat-4-480x318.jpg'
            }
          ]
        },
        5: {
          id: 5,
          name: 'Warmm',
          images: [
            {
              width: '1920w',
              url: 'image/cat-5.jpg'
            },
            {
              width: '960w',
              url: 'image/960x635/cat-5-960x635.jpg'
            },
            {
              width: '480w',
              url: 'image/480x318/cat-5-480x318.jpg'
            }
          ]
        },
        6: {
          id: 6,
          name: 'Curious',
          images: [
            {
              width: '1920w',
              url: 'image/cat-6.jpg'
            },
            {
              width: '960w',
              url: 'image/960x635/cat-6-960x635.jpg'
            },
            {
              width: '480w',
              url: 'image/480x318/cat-6-480x318.jpg'
            }
          ]
        },
        7: {
          id: 7,
          name: 'Guru',
          images: [
            {
              width: '1920w',
              url: 'image/cat-7.jpg'
            },
            {
              width: '960w',
              url: 'image/960x635/cat-7-960x635.jpg'
            },
            {
              width: '480w',
              url: 'image/480x318/cat-7-480x318.jpg'
            }
          ]
        },
        8: {
          id: 8,
          name: 'Myspot',
          images: [
            {
              width: '1920w',
              url: 'image/cat-8.jpg'
            },
            {
              width: '960w',
              url: 'image/960x635/cat-8-960x635.jpg'
            },
            {
              width: '480w',
              url: 'image/480x318/cat-8-480x318.jpg'
            }
          ]
        },
        9: {
          id: 9,
          name: 'Lazy',
          images: [
            {
              width: '1920w',
              url: 'image/cat-9.jpg'
            },
            {
              width: '960w',
              url: 'image/960x635/cat-9-960x635.jpg'
            },
            {
              width: '480w',
              url: 'image/480x318/cat-9-480x318.jpg'
            }
          ]
        },
        10: {
          id: 10,
          name: 'Feedme',
          images: [
            {
              width: '1920w',
              url: 'image/cat-10.jpg'
            },
            {
              width: '960w',
              url: 'image/960x635/cat-10-960x635.jpg'
            },
            {
              width: '480w',
              url: 'image/480x318/cat-10-480x318.jpg'
            }
          ]
        },
        11: {
          id: 11,
          name: 'Petme',
          images: [
            {
              width: '1920w',
              url: 'image/cat-11.jpg'
            },
            {
              width: '960w',
              url: 'image/960x635/cat-11-960x635.jpg'
            },
            {
              width: '480w',
              url: 'image/480x318/cat-11-480x318.jpg'
            }
          ]
        }
      };
    },

    getCat: function(id) {
      return this.getAllCats()[id];
    },

    getAllClicks: function() {
      return JSON.parse(global.window.localStorage.getItem('clicks'));
    },

    getClicks: function(id) {
      return this.getAllClicks()[id];
    },

    addClick: function(id) {
      var clicks = this.getAllClicks();

      clicks[id]++;

      global.window.localStorage.setItem('clicks', JSON.stringify(clicks));
    }
  };

  var octopus = {
    init: function() {
      model.init();
      view.init();
    },

    getAllCats: function() {
      return model.getAllCats();
    },

    getCat: function(id) {
      return model.getCat(id);
    },

    getSelectedCat: function() {
      if (this.selectedCatID) {
        return model.getCat(this.selectedCatID);
      } else {
        var cats = model.getAllCats(),
            keys = Object.keys(cats);

        // Randomly select an ID.
        this.selectedCatID = keys[Math.floor(Math.random() * keys.length)];
        return cats[this.selectedCatID];
      }
    },

    setSelectedCat: function(id) {
      this.selectedCatID = id;
      view.listView.updateSelected();
      view.detailsView.updateSelected();
    },

    getClicks: function(id) {
      return model.getClicks(id);
    },

    addClick: function() {
      var id = this.getSelectedCat().id;
      model.addClick(id);
    }
  };

  var view = {
    init: function() {
      this.listView.init();
      this.detailsView.init();
    },

    listView: {
      init: function() {
        this.listElem = global.document.getElementById('cat-list');

        this.render();
      },

      render: function() {
        var doc = global.document,
            cats = octopus.getAllCats(),
            selectedCat = octopus.getSelectedCat(),
            i,
            li,
            btn;

        for (var cat in cats) {
          li = doc.createElement('li');
          li.classList.add('cat-list-entry');

          if (cats[cat].id === selectedCat.id) {
            li.classList.add('selected');
          }

          btn = doc.createElement('button');
          btn.textContent = cats[cat].name;
          btn.id = cats[cat].id;

          btn.addEventListener('click', clickFn, false);

          li.appendChild(btn);

          this.listElem.appendChild(li);
        }

        function clickFn() {
          octopus.setSelectedCat(this.id);
        }
      },

      updateSelected: function() {
        var cat = octopus.getSelectedCat();

        // Clear existing selected.
        global.document.getElementsByClassName('selected')[0]
          .classList.remove('selected');

        // Set new selected.
        global.document.getElementById(cat.id).parentElement.classList.add('selected');
      }
    },

    detailsView: {
      init: function() {
        this.detailsElem = global.document.getElementById('cat-details');

        this.render();
      },

      render: function() {
        // Clear details view.
        this.detailsElem.innerHTML = '';

        var doc = global.document,
            nameElem = doc.createElement('h2'),
            pictureElem = doc.createElement('img'),
            clicksElem = doc.createElement('span'),
            cat = octopus.getSelectedCat();

        nameElem.id = 'cat-name';
        nameElem.textContent = cat.name;

        pictureElem.id = 'cat-picture';
        pictureElem.alt = 'A picture of a cat.';
        pictureElem.sizes = '80vw';

        pictureElem.addEventListener('click', clickFn, false);

        clicksElem.id = 'cat-clicks';

        this.detailsElem.appendChild(nameElem);
        this.detailsElem.appendChild(pictureElem);
        this.detailsElem.appendChild(clicksElem);

        this.updateSelected();

        function clickFn() {
          octopus.addClick();
          view.detailsView.updateClicks();
        }
      },

      updateClicks: function() {
        var clicksElem = global.document.getElementById('cat-clicks'),
            cat = octopus.getSelectedCat();

        clicksElem.textContent = octopus.getClicks(cat.id);
      },

      updateSelected: function() {
        var cat = octopus.getSelectedCat(),
            nameElem = global.document.getElementById('cat-name'),
            pictureElem = global.document.getElementById('cat-picture');

        nameElem.textContent = cat.name;
        pictureElem.src = cat.images[0].url;
        pictureElem.srcset = cat.images
          .reduce(function(acc, curr) {
            var set = curr.url + ' ' + curr.width;

            if (acc === '') {
              return set;
            }

            return acc += ', ' + set;
          }, '');

        this.updateClicks();
      }
    }
  };

  octopus.init();
})(this);
