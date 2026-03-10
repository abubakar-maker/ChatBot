import axios from 'axios'

export const getWeather = async (city) => {
    try {
        const API_KEY = process.env.WEATHER_API_KEY;
         const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
         const res = await axios.get(url)
         const data = res.data;
         return `Weather in ${data.name}:
🌡 Temperature: ${data.main.temp}°C
☁ Condition: ${data.weather[0].description}
💧 Humidity: ${data.main.humidity}%`;
    
    } catch (error) {
        return "Sorry, I couldn't fetch Weather right now "
    }
}