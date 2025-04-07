import { useState, useEffect } from 'react';
import { fetchWeatherApi } from 'openmeteo';
import './App.css';
import React from 'react';

type Item = {
    name: string;
    group: string;
    cost: number;
    id: number;
};

function App() {
    const [cart_Items, set_Cart_Items] = useState<Item[]>([]);
    const [menu_Items, set_Menu] = useState("");
    const [weatherData, setWeatherData] = useState<any>(null);
    const [weatherError, setWeatherError] = useState<string | null>(null); // To capture errors

    const menu: Item[]=[
        { name: 'Classic Milk Tea', group: 'Milk Tea', cost: 4.5, id: 0},
        { name: 'Honey Milk Tea', group: 'Milk Tea', cost: 4.75, id: 1},
        { name: 'Classic Coffee', group: 'Milk Tea', cost: 4.85, id: 2},
        { name: 'Coffee Milk Tea', group: 'Milk Tea', cost: 5, id: 3},
        { name: 'Classic tea', group: 'Brewed Tea', cost: 4.25, id: 4},
        { name: 'Wintermelon Tea', group: 'Brewed Tea', cost: 4.5, id: 5},
        { name: 'Honey Tea', group: 'Brewed Tea', cost:4.5, id: 6},
        { name: 'Ginger Tea', group: 'Brewed Tea', cost: 4.5, id: 7},
        { name: 'Mango Green Tea', group: 'Fruit Tea', cost: 4.95, id: 8},
        { name: 'Wintermelon Lemonade', group: 'Fruit Tea', cost: 4.95, id: 9},
        { name: 'Strawberry Tea', group: 'Fruit Tea', cost: 4.95, id: 10},
        { name: 'Peach Tea with Aiyu Jelly', group: 'Fruit Tea', cost: 5.25, id: 11},
        { name: 'Fresh Milk Tea', group: 'Fresh Milk', cost: 5, id: 12},
        { name: 'Wintermelon with Fresh Milk', group: 'Fresh Milk', cost: 5.25, id: 13},
        { name: 'Cocoa Lover with Fresh Milk', group: 'Fresh Milk', cost: 5.25, id: 14},
        { name: 'Fresh Milk Family', group: 'Fresh Milk', cost: 5.25, id: 15},
    ]

    const getWeatherIcon = (code: number): string => {
        if ([0].includes(code)) return "☀️";             // Clear
        if ([1, 2].includes(code)) return "🌤️";          // Mostly clear, partly cloudy
        if ([3].includes(code)) return "☁️";             // Overcast
        if ([45, 48].includes(code)) return "🌫️";        // Fog
        if ([51, 53, 55].includes(code)) return "🌦️";    // Drizzle
        if ([61, 63, 65].includes(code)) return "🌧️";    // Rain
        if ([66, 67].includes(code)) return "🌧️❄️";      // Freezing rain
        if ([71, 73, 75, 77].includes(code)) return "❄️"; // Snow
        if ([80, 81, 82].includes(code)) return "🌦️";    // Showers
        if ([85, 86].includes(code)) return "🌨️";        // Snow showers
        if ([95].includes(code)) return "⛈️";             // Thunderstorm
        if ([96, 99].includes(code)) return "⛈️⚡";        // Thunderstorm with hail
        return "❓";                                       // Unknown
    };
    

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                console.log("Fetching weather data...");
                const params = {
                    latitude: 30.628,
                    longitude: -96.3344,
                    current: ["temperature_2m", "weather_code", "precipitation"],
                    timezone: "Europe/Moscow",
                    temperature_unit: "fahrenheit"
                };
                const url = "https://api.open-meteo.com/v1/forecast";
                const responses = await fetchWeatherApi(url, params);
    
                if (!responses || responses.length === 0) {
                    throw new Error("Invalid response from weather API");
                }
    
                const response = responses[0];
                const current = response.current()!;
    
                const currentWeatherTime = new Date(Number(current.time()) * 1000);
                const temperature = Number(current.variables(0)!.value()).toFixed(1);
                const weatherCode = Number(current.variables(1)!.value());
                const precipitation = Number(current.variables(2)!.value()).toFixed(2);
    
                const weatherIcon = getWeatherIcon(weatherCode);
    
                const weatherData = {
                    current: {
                        time: currentWeatherTime,
                        temperature2m: temperature,
                        weatherCode,
                        precipitation,
                        icon: weatherIcon
                    }
                };
    
                setWeatherData(weatherData);
                console.log("Weather data received:", weatherData);
            } catch (error) {
                console.error("Error fetching weather data:", error);
                setWeatherError("Failed to load weather data. Check console.");
            }
        };
    
        fetchWeather();
    }, []);

    const menuCategories: Record<string, Item[]>={};

   menu.forEach(item=>{
    if(menuCategories[item.group]){
        menuCategories[item.group].push(item);
    }
    else {
        menuCategories[item.group] = [];
        menuCategories[item.group].push(item);}
   });

   const add_Item=(item:Item)=>{
        set_Cart_Items(prev_Items=>{
            const new_Item={name: item.name, group: item.group, cost: item.cost, id: item.id};
            return prev_Items.concat(new_Item);
        });
   };

   const remove_Item=(id:number)=>{
    set_Cart_Items(prev_Items=>{
        const new_Item: Item[]=[];
        prev_Items.forEach(item=>{
            if (!(id === item.id))
                new_Item.push(item);
        });
        return new_Item;
    });
   };

    
    let total_Cost = 0;
    cart_Items.forEach(item=>{
        total_Cost += item.cost;
    });
 

    return (
        <div style={{ width: '100%', display: 'flex' }}>
            {/* Weather Display - Top Right */}
            <div style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'rgba(29, 13, 13, 0.87)',
                padding: '10px',
                borderRadius: '8px',
                boxShadow: '2px 2px 10px rgba(0, 0, 0, 0.1)'
            }}>
                <h3>Weather</h3>
                {weatherData ? (
                    <div>
                        <p>{weatherData.current.icon} {weatherData.current.temperature2m}°F</p>
                        {(weatherData.current.weatherCode >= 51 && weatherData.current.weatherCode <= 67) || // Drizzle & Freezing Rain
                         (weatherData.current.weatherCode >= 61 && weatherData.current.weatherCode <= 65) || // Rain
                         (weatherData.current.weatherCode >= 80 && weatherData.current.weatherCode <= 82) || // Showers
                         (weatherData.current.weatherCode === 95 || weatherData.current.weatherCode === 96 || weatherData.current.weatherCode === 99) // Thunderstorms
                        ? (
                            <p>🌧️ Precipitation: {weatherData.current.precipitation} mm</p>
                        ) : null}
                        <p>Last Updated: {weatherData.current.time.toLocaleString(undefined, {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</p>
                        
                    </div>
                ) : (
                    <p>Loading Weather...</p>
                )}

            </div>

            {/*Left (80%) side of the page, menu item buttons*/}
            <div style= {{
                width: '80%',
                display: 'flex',
                flexDirection: 'column'
                }}>
                <h1> Menu </h1> 
                
                {
                Object.entries(menuCategories).map(([key_Cat, value_Items])=>(
                    <div key={key_Cat}>
                        <h2> {key_Cat} </h2>
                        <div style = {{
                            display: 'flex'
                            }}>
                            {
                                value_Items.map((item)=>(
                                    <button key={item.id}
                                        onClick={()=> add_Item(item)}
                                        style = {{
                                            height: '150px',
                                            width: '150px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center'
                                        }}
                                    >
                                    
                                        <span style = {{
                                            justifyContent: 'center'
                                            }}>
                                            {item.name}
                                        </span>

                                        <span style = {{
                                            justifyContent: 'center'
                                            }}>
                                            {item.cost}
                                        </span>
                                    </button>
                                ))
                            }
                        </div>
                    </div>
                    ))
                }
            </div>
            {/*Right (20%) side of the page, current order*/}
            <div style = {{
                width: '20%',
                display: 'flex',
                flexDirection: 'column'
                }}>
                
                <h2> Order </h2>

                <div style = {{
                    overflowY:  'auto',
                    }}>

                    {cart_Items.map(item=>(
                        <div key = {item.id}
                            style = {{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                            <div>
                                <div>
                                    {item.name}
                                </div>
                                <div>
                                    {item.cost}
                                </div>
                            </div>
                            <button onClick={()=> remove_Item(item.id)}>
                                x
                            </button>
                        </div>
                        ))
                    }
                </div>

                <div style = {{
                    }}>
                    <div style = {{
                        display: 'flex',
                        }}>
                        <span> Total: </span>
                        <span> ${total_Cost} </span>
                    </div>
                    <button>
                        Checkout
                    </button>
                </div>
            </div>








        </div>
    );
}

export default App;
