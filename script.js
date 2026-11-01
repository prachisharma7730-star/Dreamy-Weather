// ========================================
// DREAMY WEATHER
// OpenWeather API Integration
// ========================================


// 1. CONNECT HTML ELEMENTS

const homeScreen = document.getElementById("home-screen");
const weatherScreen = document.getElementById("weather-screen");

const weatherForm = document.getElementById("weather-form");
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-button");

const searchMessage = document.getElementById("search-message");

const backButton = document.getElementById("back-button");
const homeLink = document.getElementById("home-link");

const cityName = document.getElementById("result-city");
const cityLocation = document.getElementById("result-location");

const weatherIcon = document.getElementById("weather-icon");
const weatherDescription = document.getElementById("weather-description");
const weatherLocalTime = document.getElementById("weather-local-time");

const temperatureValue = document.getElementById("temperature-value");
const feelsLike = document.getElementById("feels-like");

const humidityValue = document.getElementById("humidity-value");
const windValue = document.getElementById("wind-value");
const windDirection = document.getElementById("wind-direction");
const precipitationValue = document.getElementById("precipitation-value");

const weatherSource = document.getElementById("weather-source");


// 2. OPENWEATHER API CONFIGURATION

const API_KEY = "98acb7b8524e334ae5931996cbd1fc65";

const WEATHER_API = "https://api.openweathermap.org/data/2.5/weather";

// 3. GET A WEATHER EMOJI

function getWeatherIcon(weatherCode, iconCode) {

    const isDay = iconCode && iconCode.endsWith("d");

    if (weatherCode >= 200 && weatherCode < 300) {
        return "⛈️";
    }

    if (weatherCode >= 300 && weatherCode < 400) {
        return "🌦️";
    }

    if (weatherCode >= 500 && weatherCode < 600) {
        return "🌧️";
    }

    if (weatherCode >= 600 && weatherCode < 700) {
        return "❄️";
    }

    if (weatherCode >= 700 && weatherCode < 800) {
        return "🌫️";
    }

    if (weatherCode === 800) {
        return isDay ? "☀️" : "🌙";
    }

    if (weatherCode === 801) {
        return isDay ? "🌤️" : "☁️";
    }

    if (weatherCode === 802) {
        return "⛅";
    }

    if (weatherCode === 803 || weatherCode === 804) {
        return "☁️";
    }

    return "🌥️";
}


// 4. FETCH WEATHER FOR THE ENTERED CITY

async function getWeather(city) {

    const url =
        `${WEATHER_API}?q=${encodeURIComponent(city)}` +
        `&appid=${API_KEY}&units=metric`;

    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok) {

        if (response.status === 404) {
            throw new Error(
                "City not found. Please check the spelling and try again."
            );
        }

        if (response.status === 401) {
            throw new Error(
                "The API key is invalid or not active yet. " +
                "Check your OpenWeather account and try again later."
            );
        }

        if (response.status === 429) {
            throw new Error(
                "Too many weather requests. Please wait and try again."
            );
        }

        throw new Error(
            data.message
                ? `Weather service error: ${data.message}`
                : "Unable to retrieve weather information. Please try again."
        );
    }

    if (!data.main || !data.weather || !data.weather.length) {
        throw new Error(
            "The weather information returned was incomplete."
        );
    }

    return data;
}


// 5. FORMAT THE CITY'S LOCAL TIME

function getLocalObservationTime(weatherData) {

    const timestamp = weatherData.dt;
    const timezoneOffset = weatherData.timezone;

    // OpenWeather provides the observation timestamp in UTC
    // and the city's timezone offset in seconds.

    const localTimestamp =
        (timestamp + timezoneOffset) * 1000;

    const date = new Date(localTimestamp);

    return date.toISOString().slice(0, 16).replace("T", " ");
}


// 6. DISPLAY THE WEATHER RESULTS

function displayWeather(data) {

    const currentWeather = data.weather[0];
    const weatherCode = currentWeather.id;

    // Display city name.

    cityName.textContent = data.name || "Unknown city";


    // Display country.

    cityLocation.textContent =
        data.sys && data.sys.country
            ? data.sys.country
            : "Location information unavailable";


    // Display weather description.

    weatherDescription.textContent =
        currentWeather.description
            .split(" ")
            .map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
            )
            .join(" ");


    // Display weather icon.

    weatherIcon.textContent = getWeatherIcon(
        weatherCode,
        currentWeather.icon
    );


    // Display temperature in Celsius.

    temperatureValue.textContent =
        Math.round(data.main.temp);


    // Display feels-like temperature.

    feelsLike.textContent =
        `Feels like ${Math.round(data.main.feels_like)}°C`;


    // Display humidity.

    humidityValue.textContent =
        data.main.humidity;


    // Display wind speed in km/h.
    // OpenWeather's metric wind speed is in metres per second.

    windValue.textContent =
        Math.round((data.wind?.speed || 0) * 3.6 * 10) / 10;


    // Display wind direction.

    if (data.wind && data.wind.deg !== undefined) {
        windDirection.textContent = `${data.wind.deg}°`;
    } else {
        windDirection.textContent = "Unavailable";
    }


    // Display precipitation.
    // Rain and snow amounts are reported when available.

    const rainAmount = data.rain?.["1h"] || 0;
    const snowAmount = data.snow?.["1h"] || 0;

    precipitationValue.textContent =
        Math.round((rainAmount + snowAmount) * 10) / 10;


    // Display the observation time.

    weatherLocalTime.textContent =
        `Local observation time: ${getLocalObservationTime(data)}`;


    // Update the data source credit.

    weatherSource.textContent =
        "Weather data provided by OpenWeather.";


    // IMPORTANT: SWITCH TO THE RESULTS INTERFACE.

    homeScreen.hidden = true;
    weatherScreen.hidden = false;


    // Clear the search message.

    searchMessage.textContent = "";


    // Move to the top of the results interface.

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// 7. HANDLE THE CITY SEARCH FORM

weatherForm.addEventListener("submit", async function (event) {

    // Prevent the browser from refreshing the page.

    event.preventDefault();

    const city = cityInput.value.trim();


    // Validate the city input.

    if (!city) {

        searchMessage.textContent =
            "Please enter a city name.";

        cityInput.focus();

        return;
    }


    // Check whether the API key placeholder was replaced.

    if (
        !API_KEY ||
        API_KEY === "PASTE_YOUR_OPENWEATHER_API_KEY_HERE"
    ) {

        searchMessage.textContent =
            "Please configure your OpenWeather API key first.";

        return;
    }


    // Show the loading state.

    searchButton.disabled = true;
    searchButton.textContent = "Finding your sky...";

    searchMessage.textContent =
        "Searching the sky above you...";


    try {

        // Retrieve the city's current weather.

        const weatherData = await getWeather(city);


        // Display the results and switch interfaces.

        displayWeather(weatherData);

    } catch (error) {

        console.error("Dreamy Weather error:", error);

        searchMessage.textContent =
            error.message ||
            "Something went wrong. Please try again.";

    } finally {

        // Restore the search button.

        searchButton.disabled = false;
        searchButton.textContent = "Find My Sky ↗";
    }

});


// 8. CONNECT THE BACK BUTTON

backButton.addEventListener("click", function () {

    weatherScreen.hidden = true;
    homeScreen.hidden = false;

    cityInput.value = "";
    searchMessage.textContent = "";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    cityInput.focus();

});


// 9. CONNECT THE LOGO TO THE HOMEPAGE

homeLink.addEventListener("click", function (event) {

    event.preventDefault();

    weatherScreen.hidden = true;
    homeScreen.hidden = false;

    searchMessage.textContent = "";

});


// 10. CONFIRM THAT THE JAVASCRIPT HAS LOADED

console.log("Dreamy Weather JavaScript loaded successfully.");
