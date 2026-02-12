
let locations = [];

fetch("Stores.csv")
  .then(response => response.text())
  .then(csvText => {
    locations = parseCSV(csvText);
    locations = locations.filter((place) => place.State === "SC")
    initMap(); //&callback=initMap
  })
  .catch(err => {
    console.error("Failed to load locations.csv", err);
    window.location.reload();
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
    disableDefaultUI: true,
    zoomControl: true,
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
      addressControl: false,     
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
      //checkLocationMatch();
    });
  });
}

function selectLocation(location) {
  selectedLocation = location;
  console.log("Selected location:", selectedLocation.StoreNumber);

  document.getElementById("selectedLocationDisplay").textContent =
    `${selectedLocation.StoreNumber}: ${location.City}, ${location.State}`;
}

window.addEventListener("DOMContentLoaded", (event) => {
  document.getElementById("submitGuess").addEventListener("click", checkLocationMatch);
  
  document.getElementById("closeResults").addEventListener("click", () => {
    document.getElementById("popup-overlay").classList.add("hidden");
    document.getElementById("popup").classList.add("hidden");

    document.getElementById("pano").classList.remove("hidden");
    
  });

  document.addEventListener("keydown", function (event) {
  if (event.key === "Enter" || event.key === "NumpadEnter") {
    checkLocationMatch();
  }
  });
});


function checkLocationMatch() {
  document.getElementById("popup-overlay").classList.remove("hidden");
  document.getElementById("popup").classList.remove("hidden");
  
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
    document.getElementById("RightWrong").textContent = `Correct!`;
    document.getElementById("HowClose").textContent =
    `It was Store # ${correctLocation.StoreNumber} in ${correctLocation.City}, ${correctLocation.State}.`;

  } 
  else if (correctLocation.State === selectedLocation.State) {
    document.getElementById("RightWrong").textContent = `Nice one!`;
    document.getElementById("HowClose").innerHTML =
  `You were right to pick "${correctLocation.State}", but it was Store #${correctLocation.StoreNumber} in ${correctLocation.City}.<br>
   You were ${Math.round(distanceMiles)} miles away.`;

    console.log(
      `Incorrect, off by ${distanceMiles.toFixed(1)} miles. You were ${Math.round(distanceMiles)} miles away.`
    );
  }
  else {
    document.getElementById("RightWrong").textContent = `Not Quite!`;
    document.getElementById("HowClose").innerHTML =
    `The correct store was Store #${correctLocation.StoreNumber} in ${correctLocation.City}, ${correctLocation.State}.
    <br> You were ${Math.round(distanceMiles)} miles away.`;

  };
  document.getElementById("ButtonDisplay").textContent = "Refresh the page and play again!"
}

