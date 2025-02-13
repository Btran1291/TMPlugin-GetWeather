async function get_weather(params, userSettings) {
  const { location, count = 5, language = 'en', include_current_weather = true, include_hourly_weather = true, include_daily_weather = true } = params;
  const { current_weather = 'temperature_2m,relative_humidity_2m,is_day,precipitation,wind_speed_10m, weather_code', hourly_weather = 'temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m,weather_code', daily_weather = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max', temperature_unit = 'fahrenheit', timezone = 'auto' } = userSettings;
  const locationParts = location.split(',').map(part => part.trim());
  const cityName = locationParts[0];
  const stateName = locationParts.length > 1 ? locationParts[1] : null;
  const geocodeApiUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=${count}&language=${language}&format=json`;
  try {
    const geocodeResponse = await fetch(geocodeApiUrl);
    const geocodeData = await geocodeResponse.json();
    if (!geocodeData.results || geocodeData.results.length === 0) {
      console.error('No location found');
      return { error: 'No location found' };
    }
    const matchingResults = geocodeData.results.filter(result => {
      const adminFields = [result.admin1, result.admin2, result.admin3, result.admin4, result.country, result.country_code].map(admin => admin ? admin.toLowerCase() : '');
      return (!stateName || adminFields.includes(stateName.toLowerCase()));
    });
    if (matchingResults.length === 0) {
      console.error('No matching location found for the specified state');
      return { error: 'No matching location found for the specified state' };
    }
    const { latitude, longitude } = matchingResults[0];
    let weatherApiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}`;
    if (include_current_weather === true) { weatherApiUrl += `&current=${current_weather.split(',').map(item => item.trim()).join(',')}`; }
    if (include_hourly_weather === true) { weatherApiUrl += `&hourly=${hourly_weather.split(',').map(item => item.trim()).join(',')}`; }
    if (include_daily_weather === true) { weatherApiUrl += `&daily=${daily_weather.split(',').map(item => item.trim()).join(',')}`; }
    weatherApiUrl += `&temperature_unit=${temperature_unit}&timezone=${encodeURIComponent(timezone)}`;
    console.log('Fetching weather data from:', weatherApiUrl);
    const weatherResponse = await fetch(weatherApiUrl);
    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text();
      console.error('Error fetching weather data:', weatherResponse.status, errorText);
      throw new Error('Failed to fetch weather data');
    }
    const weatherData = await weatherResponse.json();
    return weatherData;
  } catch (error) {
    console.error('Error:', error.message);
    return { error: error.message };
  }
}
