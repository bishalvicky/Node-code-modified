function initialize() {

  var locations = [
    ['1', 28.728249, 77.157507],
    ['2', 28.80010, 77.287478],
    ['3', 28.890542, 77.274856],
    ['4', 28.923036, 77.259052],
    ['5', 28.950198, 77.259302]
  ];

  var loc_len = Math.floor(locations.length/2);

  console.log(loc_len);

  var mapOptions = {
    zoom: 11,
    center: new google.maps.LatLng(locations[loc_len][1], locations[loc_len][2])
  };

  var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

  var infowindow = new google.maps.InfoWindow();
/*
  var icon = new google.maps.MarkerImage(
            url: "http://upload.wikimedia.org/wikipedia/commons/f/f1/Ski_trail_rating_symbol_red_circle.png", //url
            scaledSize: new google.maps.Size(50, 50), // scaled size
            origin: new google.maps.Point(0,0), // origin
            anchor: new google.maps.Point(0, 0) // anchor
  );
*/

  var pinIcon = new google.maps.MarkerImage(
    "circle.png",
    null, /* size is determined at runtime */
    null, /* origin is 0,0 */
    null, /* anchor is bottom center of the scaled image */
    new google.maps.Size(10, 10)
  );

  var traceCoordinates = [];
  var marker, i;

  for (i = 0; i < locations.length; i++) {

    var point = new google.maps.LatLng(locations[i][1], locations[i][2]);

    traceCoordinates.push(point);

    marker = new google.maps.Marker({
      position: point,
      map: map,
      //icon: pinIcon
      animation: google.maps.Animation.BOUNCE,
    });

    marker.setMap(map);
    
    google.maps.event.addListener(marker, 'click', (function (marker, i) {
        return function () {
            infowindow.setContent(locations[i][0]);
            infowindow.open(map, marker);
        }
    })(marker, i));

  }

  var tracePath = new google.maps.Polyline({
    path: traceCoordinates,
    geodesic: true,
    strokeColor: '#FF0000',
    strokeOpacity: 1.0,
    strokeWeight: 2
  });

  tracePath.setMap(map);
 
}

google.maps.event.addDomListener(window, 'load', initialize);