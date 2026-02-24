
let locations = [];
const goodStores = [1200,1111,7520,7537,8500,7675,6848,5659,7964,8692,7656,8870,6513,8776,5820,7532,6519, 2189,
                    7292, 6986, 6899, 8553, 7510, 7855, 8507, 8524, 7460, 8663, 7752, 8532, 7940, 7282,6581,
                    7209,7743,7263,6865,6588,8787,8910,7600,7689,6560, 7024,7782,7853,7567,8764,6750,8605,8951,7204,6825,8780,
                   7364,7964,8799,2134,2164,7521,8781,8881]

const newStores = [2204,5525,5527,5690,5698,5722,6504,6510,6514,6536,
                    6543,6545,6571,6576,6596,6629,6658,6659,6682,6702,
                    6763,6813,6842,6965,7002,7023,7046,7090,7094,7096,
                    7140,7141,7351,7356,7374,7375,7377,7428,7510,7570,
                    7615,7624,7847,7865,7880,7881,7890,7906,7919,7921,
                    7922,7930,7931,7960,7961,7963,7965,7969,7983,7984,
                    7985,7986,7988,7993,7994,8590,8615,8744,8768,8810,
                    8818,8950,8972,8974,8975,8977,8979,1200]
fetch("Stores.csv")
  .then(response => response.text())
  .then(csvText => {
    locations = parseCSV(csvText);
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
    center: { lat: 40, lng: -95 },
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
      panControl: true
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
  
  document.querySelectorAll(".close-title").forEach(button => {
  button.addEventListener("click", () => {
    document.getElementById("popup-overlay").classList.add("hidden");
    document.getElementById("popup-start").classList.add("hidden");
    document.getElementById("pano").classList.remove("hidden");
    document.getElementById("ui-layer").classList.remove("hidden");
    document.getElementById("map-container").classList.remove("hidden");
  });
});

  document.addEventListener("keydown", function (event) {
  if (event.key === "Enter" || event.key === "NumpadEnter") {
    checkLocationMatch();
  }
  });

  document.getElementById("choose-curated").addEventListener("click", () => {
    locations = locations.filter((place) => goodStores.includes(Number(place.StoreNumber)));
    initMap();
  });

  document.getElementById("choose-all").addEventListener("click", () => {
    initMap();
  });

  document.getElementById("choose-2025").addEventListener("click", () => {
    locations = locations.filter((place) => newStores.includes(Number(place.StoreNumber)));
    //locations = locations.filter((place) => place.State === "NE" || place.State === "NY" || place.State === "VA");
    initMap();
  });

  document.getElementById("show-hints").addEventListener("click", () => {
    document.getElementById("hint").textContent = `This store is in ${correctLocation.State}`
  });

  document.getElementById("show-tips").addEventListener("click", () => {
    document.getElementById("popup-tips").classList.remove("hidden");
    document.getElementById("show-tips").classList.add("hidden");
    document.getElementById("close-tips").classList.remove("hidden");
  });

  document.getElementById("close-tips").addEventListener("click", () => {
    document.getElementById("popup-tips").classList.add("hidden");
    document.getElementById("close-tips").classList.add("hidden");
    document.getElementById("show-tips").classList.remove("hidden");
    document.getElementById("pano").classList.remove("hidden");
    document.getElementById("map-container").classList.remove("hidden");
  });

  document.getElementById("close-results").addEventListener("click", () => {
    window.location.reload();
  });
  

  
});


function checkLocationMatch() {
  document.getElementById("popup-overlay").classList.remove("hidden");
  document.getElementById("popup-result").classList.remove("hidden");
  
  const correctLatLng = new google.maps.LatLng(
    correctLocation.Latitude,
    correctLocation.Longitude
  );

  const selectedLatLng = new google.maps.LatLng(
    selectedLocation.Latitude,
    selectedLocation.Longitude
  );

  resultMap = new google.maps.Map(document.getElementById("map-result"), {
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: false,
    zoomControl: false,
    scrollwheel: false,
    disableDoubleClickZoom: true,
    draggable: false
  });
  new google.maps.Marker({
      position: selectedLatLng,
      map: resultMap,
      title: (selectedLocation.StoreNumber + ": " + selectedLocation.City + ", " + selectedLocation.State),
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 4,
        fillColor: "#ff0000",
        fillOpacity: 1,
        strokeWeight: 1
      }
    });
  new google.maps.Marker({
      position: correctLatLng,
      map: resultMap,
      title: (correctLocation.StoreNumber + ": " + correctLocation.City + ", " + correctLocation.State),
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 4,
        fillColor: "#0000ff",
        fillOpacity: 1,
        strokeWeight: 1
      }
    });

  if (correctLocation.StoreNumber != selectedLocation.StoreNumber) {
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(correctLatLng);
    bounds.extend(selectedLatLng);
    resultMap.fitBounds(bounds);
  }
  else {
    resultMap.setCenter(correctLatLng);
    resultMap.setZoom(5);
  }
  

  

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
  `You were right to pick "${correctLocation.State}", but it was Store #${correctLocation.StoreNumber} in ${correctLocation.City} (blue).<br>
   You were ${Math.round(distanceMiles)} miles away.`;

    console.log(
      `Incorrect, off by ${distanceMiles.toFixed(1)} miles. You were ${Math.round(distanceMiles)} miles away.`
    );
  }
  else {
    document.getElementById("RightWrong").textContent = `Not Quite!`;
    document.getElementById("HowClose").innerHTML =
    `The correct store was Store #${correctLocation.StoreNumber} in ${correctLocation.City}, ${correctLocation.State} (blue).<br>
    You were ${Math.round(distanceMiles)} miles away.`;

  };
  document.getElementById("ButtonDisplay").textContent = "Refresh the page and play again!"
}

