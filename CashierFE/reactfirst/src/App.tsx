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

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                console.log("Fetching weather data...");
                const params = {
                    latitude: 30.628,
                    longitude: -96.3344,
                    hourly: "temperature_2m",
                    current: "temperature_2m",
                    timezone: "auto",
                    forecast_days: 1,
                    temperature_unit: "fahrenheit"
                };
                const url = "https://api.open-meteo.com/v1/forecast";
                const responses = await fetchWeatherApi(url, params);
        
                if (!responses || responses.length === 0) {
                    throw new Error("Invalid response from weather API");
                }
        
                const response = responses[0];
                const utcOffsetSeconds = response.utcOffsetSeconds();
                const current = response.current()!;
                const hourly = response.hourly()!;
        
                const range = (start: number, stop: number, step: number) =>
                    Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);
        
                const rawTimes = range(Number(hourly.time()), Number(hourly.timeEnd()), hourly.interval()).map(
                    (t) => new Date((t + utcOffsetSeconds) * 1000)
                );
        
                const rawTemps = hourly.variables(0)!.valuesArray()!;
        
                const now = new Date();
        
                // Filter times and temperatures to show only upcoming hours
                const filteredForecast = rawTimes
                    .map((time, index) => ({ time, temp: rawTemps[index] }))
                    .filter(entry => entry.time >= now);
        
                const weatherData = {
                    current: {
                        time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
                        temperature2m: Number(current.variables(0)!.value()).toFixed(1),
                    },
                    hourly: {
                        time: filteredForecast.map(entry => entry.time),
                        temperature2m: filteredForecast.map(entry => Number(entry.temp).toFixed(1)),
                    },
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

    var menu_Data = JSON.parse(JSON.stringify(menu_Items));
        const menu: Item[] = [];
        for(var i in menu_Data){
            menu.push({id: menu_Data[i].id, name: menu_Data[i].item_name, cost: menu_Data[i].base_cost, group: menu_Data[i].item_group});
        }

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
                {weatherError ? (
                    <p style={{ color: 'red' }}>{weatherError}</p>
                ) : weatherData ? (
                    <div>
                        <p>🌡️ Current Temp: {weatherData.current.temperature2m}°F</p>
                        <p>📅 Hourly Forecast:</p>
                        <ul style={{ maxHeight: '150px', overflowY: 'auto' }}>
                            {weatherData.hourly.time.map((time: Date, index: number) => (
                                <li key={index}>
                                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {weatherData.hourly.temperature2m[index]}°F
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p>Loading Weather...</p>
                )}
            </div>

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
