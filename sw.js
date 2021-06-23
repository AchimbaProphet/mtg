self.addEventListener("install", function(event) {
    event.waitUntil(
        caches.open("v1").then(function(cache) {
            return cache.addAll([
                "index.html",
                "counter.css",
                "counter.js",
                "hammer.2.0.8.min.js",
                "slideout.min.js",
                "img/head.png",
                "img/hr.png",
                "img/skull.gif",
                "img/touch-icon-192.png"
            ]);
        })
    );
});

self.addEventListener("fetch", function(event) {
  event.respondWith(caches.match(event.request).then(function(response) {
    if (response !== undefined) {
      return response;
    } else {
      return fetch(event.request).then(function (response) {
        var responseClone = response.clone();
        caches.open("v1").then(function (cache) {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(function () {
        return caches.match("img/skull.gif");
      });
    }
  }));
});
