$(document).ready(function () {
  
  //Declare all global variables
  // HTML elements to pass data to display
  const cityEl = $('h2#city');
  const dateEl = $('h3#date');
  const weatherIconEl = $('img#weather-icon');
  const temperatureEl = $('span#temperature');
  const humidityEl = $('span#humidity');
  const windEl = $('span#wind');
  const uvIndexEl = $('span#uv-index');
  const cityListEl = $('div.cityList');

//Open Weather API
  const apiKey= '8fede9f03a84dd4ebe7cc3bfaacd1a44';

  const cityInput = $('#city-input');

  //past searched cities stored in an array
  let pastCities = [];

  function compare(a, b) {
    // Use toUpperCase() to ignore character casing
    const cityA = a.city.toUpperCase();
    const cityB = b.city.toUpperCase();

    let comparison = 0;
    if (cityA > cityB) {
        comparison = 1;
    } else if (cityA < cityB) {
        comparison = -1;
    }
    return comparison;
}
  
  function loadCities() {
    const storedCities = JSON.parse(localStorage.getItem('pastCities'));
    if (storedCities) {
      pastCities = storedCities;
    
    }

  }


function storeCities() {
  localStorage.setItem('pastCities', JSON.stringify(pastCities));

  }

function urlInput(city){
    if(city) {
      return `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
    }
  }

  function urlId(id) {
return `https://api.openweathermap.org/data/2.5/weather?q=${id}&appid=${apiKey}`;
}
//show past 5 city
function displayCities(pastCities){
  cityListEl.empty();
  pastCities.splice(5);
  
  let sortedCities = [...pastCities];
  sortedCities.sort(compare);
  sortedCities.forEach(function (location) {
      let cityDiv = $('<div>').addClass('col-12 city');
      let cityBtn = $('<button>').addClass('btn btn-light city-btn').text(location.city);
      cityDiv.append(cityBtn);
      cityListEl.append(cityDiv);
  });
}

function setUVIndexColor(uvi) {
  if (uvi < 3) {
      return 'green';
  } else if (uvi >= 3 && uvi < 6) {
      return 'yellow';
  } else if (uvi >= 6 && uvi < 8) {
      return 'orange';
  } else if (uvi >= 8 && uvi < 11) {
      return 'red';
  } else return 'purple';
}

//Weather conditions
function searchWeather(queryURL) {

  $.ajax({
    url: queryURL,
    method: 'GET'
}).then(function (response) {

  //Stores input City in the past city list
  let city = response.name;
  let id = response.id;

            if (pastCities[0]) {
              pastCities = $.grep(pastCities, function (storedCity) {
                  return id !== storedCity.id;
              })
            }
            //Display current weather
            pastCities.unshift({ city, id });
            storeCities();
            displayCities(pastCities);

            cityEl.text(response.name);
            let formattedDate = moment.unix(response.dt).format('L');
            
            dateEl.text(formattedDate);
            let weatherIcon = response.weather[0].icon;
            
            weatherIconEl.attr('src', `http://openweathermap.org/img/wn/${weatherIcon}.png`).attr('alt', response.weather[0].description);
            temperatureEl.html(((response.main.temp - 273.15) * 1.8 + 32).toFixed(1));
            humidityEl.text(response.main.humidity);
            windEl.text((response.wind.speed * 2.237).toFixed(1));

            //Open Weather API OneCall latitude and longitude to get UV index
            let lat = response.coord.lat;
            let lon = response.coord.lon;

            let queryURLAll = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}`;
            $.ajax({
                url: queryURLAll,
                method: 'GET'
            }).then(function (response) {
                let uvIndex = response.current.uvi;
                let uvColor = setUVIndexColor(uvIndex);
                uvIndexEl.text(response.current.uvi);
                uvIndexEl.attr('style', `background-color: ${uvColor}; color: ${uvColor === "red" ? "black" : "white"}`);
                let fiveDay = response.daily;

                // Display 5 day forecast 
                for (let i = 0; i <= 5; i++) {
                    let currDay = fiveDay[i];
                    $(`div.day-${i} .card-title`).text(moment.unix(currDay.dt).format('L'));
                    $(`div.day-${i} .fiveDay-img`).attr(
                        'src',
                        `http://openweathermap.org/img/wn/${currDay.weather[0].icon}.png`
                    ).attr('alt', currDay.weather[0].description);
                    $(`div.day-${i} .fiveDay-temp`).text(((currDay.temp.day - 273.15) * 1.8 + 32).toFixed(1));
                    $(`div.day-${i} .fiveDay-humid`).text(currDay.humidity);
                }
            });
        });
    }

     // Display the last searched city
     function displayLastSearchedCity() {
        if (pastCities[0]) {
            let queryURL = urlId(pastCities[0].id);
            searchWeather(queryURL);
        } else {
            //if no past searched cities, load New York weather data
            let queryURL = urlInput("New York");
            searchWeather(queryURL);
        }
    }
 
    // Click handler for search button
    $('#search-btn').on('click', function (event) {
        // Preventing the button from trying to submit the form
        event.preventDefault();

        // Retrieving and scrubbing the city from the inputs
        let city = cityInput.val().trim();
        city = city.replace(' ', '%20');

        // Clear the input fields
        cityInput.val('');

        // Build the query url with the city and searchWeather
        if (city) {
            let queryURL = urlInput(city);
            searchWeather(queryURL);
        }
    }); 
    
    //buttons to load that city's weather
    $(document).on("click", "button.city-btn", function (event) {
        let clickedCity = $(this).text();
        let foundCity = $.grep(pastCities, function (storedCity) {
            return clickedCity === storedCity.city;
        })
        let queryURL = urlId(foundCity[0].id)
        searchWeather(queryURL);
    });

//load any cities in local storage into array
    loadCities();
    displayCities(pastCities);

  //Display weather for last searched city
    displayLastSearchedCity();

});







//Check Open Weather API is connected
/*function weatherDash(cityID) { var key = '8fede9f03a84dd4ebe7cc3bfaacd1a44';
fetch('https://api.openweathermap.org/data/2.5/weather?id=' + cityID+ '&appid=' + key)  
.then(function(resp) { return resp.json() }) // Convert data to json
.then(function(data) {
console.log(data);
})
.catch(function() {
// catch any errors
});

}

window.onload = function() { weatherDash( 6167865 );
}
*/

  
 

  