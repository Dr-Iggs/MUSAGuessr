
let locations = [];

fetch("Stores.csv")
  .then(response => response.text())
  .then(csvText => {
    locations = parseCSV(csvText);
    initMap(); //&callback=initMap
  })
  .catch(err => {
    console.error("Failed to load locations.csv", err);
  });

function parseCSV(csvText) {
  const lines = csvText.trim().split("\n");
  const headers = lines.shift().split(",");

  return lines.map(line => {
    const values = line.split(",");
    const obj = {};

    headers.forEach((header, i) => {
      const key = header.trim();
      let value = values[i].trim();

      // Convert numbers
      if (key === "Latitude" || key === "Longitude") {
        value = Number(value);
      }

      obj[key] = value;
    });

    return obj;
  });
}


let map;
let panorama;
let selectedLocation = null;
let correctLocation = null;

function initMap() {
  const streetViewService = new google.maps.StreetViewService();

  correctLocation = locations[Math.floor(Math.random() * locations.length)];
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 40, lng: -90 },
    zoom: 4,
    streetViewControl: false
  });
  map.setClickableIcons(false);

  panorama = new google.maps.StreetViewPanorama(
    document.getElementById("pano"),
    {
      pov: {
        heading: Math.random() * 360,
        pitch: 0
      },
      zoom: 1,
      addressControl: false,      // ← THIS hides city/state text
      showRoadLabels: false,
    }
  );

  map.setStreetView(panorama);
  
  // Find nearest Street View pano and set it
  streetViewService.getPanorama(
    {
      location: { lat: correctLocation.Latitude, lng: correctLocation.Longitude },
      radius: 50
    },
    (data, status) => {
      if (status === "OK") {
        panorama.setPano(data.location.pano);
      } else {
        console.warn("No Street View available for this location");
        }
    }
  );
  addMarkers(map);
  console.log(correctLocation.StoreNumber + ": " + correctLocation.City + ", " + correctLocation.State);
}

function addMarkers(map) {
  locations.forEach(location => {
    const marker = new google.maps.Marker({
      position: { lat: location.Latitude, lng: location.Longitude },
      map,
      title: (location.StoreNumber + ": " + location.City + ", " + location.State),
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 2,
        fillColor: "#ff0000",
        fillOpacity: 1,
        strokeWeight: 1
      }
    });

    marker.addListener("click", () => {
      selectLocation(location);
    });
  });
}

function selectLocation(location) {
  selectedLocation = location;
  console.log("Selected location:", selectedLocation.StoreNumber);

  document.getElementById("selectedLocationDisplay").textContent =
    `${selectedLocation.StoreNumber}: ${location.City}, ${location.State}`;
}

document.getElementById("submitGuess").addEventListener("click", checkLocationMatch);

document.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    //event.preventDefault(); // prevents form submit / reload
    checkLocationMatch();
  }
});

function checkLocationMatch() {
  console.log('checking');
  const correctLatLng = new google.maps.LatLng(
    correctLocation.Latitude,
    correctLocation.Longitude
  );

  const selectedLatLng = new google.maps.LatLng(
    selectedLocation.Latitude,
    selectedLocation.Longitude
  );

  const distanceMeters =
    google.maps.geometry.spherical.computeDistanceBetween(
      correctLatLng,
      selectedLatLng
    );

  const distanceMiles = distanceMeters * 0.000621371;

  if (correctLocation.StoreNumber === selectedLocation.StoreNumber) {
    console.log("Correct!");
  } else {
    console.log(
      `Incorrect, off by ${distanceMiles.toFixed(1)} miles.`
    );
  };
}

// function selectLocation(location) {
//   streetViewService.getPanorama(
//     { location: { lat: location.lat, lng: location.lng }, radius: 50 },
//     (data, status) => {
//       if (status === "OK") {
//         panorama.setPano(data.location.pano);
//         panorama.setPov({
//           heading: Math.random() * 360,
//           pitch: 0
//         });
//       } else {
//         alert("No Street View available here.");
//       }
//     }
//   );

//   selectedLocationId = location.id;
// }
