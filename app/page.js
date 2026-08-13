'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'weeether-default-city';

const QUICK_CITIES = [
  'Vancouver',
  'Victoria',
  'Kelowna',
  'Kamloops',
  'Prince George',
  'Nanaimo',
  'Abbotsford',
  'Chilliwack'
];

export default function Home() {
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [defaultCity, setDefaultCity] = useState(null);
  const [ready, setReady] = useState(false);
  const [setupInput, setSetupInput] = useState('');

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    }
  }, []);

  useEffect(() => {
    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {}

    if (saved && saved.trim()) {
      setDefaultCity(saved.trim());
      setCity(saved.trim());
      fetchWeather(saved.trim());
    }
    setReady(true);
  }, []);

  async function fetchWeather(query) {
    const q = (query || city).trim();
    if (!q) {
      setError('Please enter a city name');
      return;
    }
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await fetch('/api/weather?city=' + encodeURIComponent(q));
      const json = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        setError(json.error || ('Request failed (' + res.status + ')'));
        setLoading(false);
        return;
      }
      setData(json);
      setCity(q);
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  }

  function saveDefaultCity(name) {
    const cleaned = name.trim();
    if (!cleaned) return;
    try {
      localStorage.setItem(STORAGE_KEY, cleaned);
    } catch (e) {}
    setDefaultCity(cleaned);
    setCity(cleaned);
    fetchWeather(cleaned);
  }

  function handleSetupSubmit(e) {
    e.preventDefault();
    if (setupInput.trim()) {
      saveDefaultCity(setupInput);
    }
  }

  function handleSetupQuick(c) {
    setSetupInput(c);
    saveDefaultCity(c);
  }

  function handleSubmit(e) {
    e.preventDefault();
    fetchWeather();
  }

  function handleQuick(c) {
    setCity(c);
    fetchWeather(c);
  }

  if (!ready) {
    return (
      <div className="app-container">
        <div className="loading">
          <div className="spinner" />
          Loading...
        </div>
      </div>
    );
  }

  if (!defaultCity) {
    return (
      <div className="app-container">
        <header>
          <h1>Weeether</h1>
          <p>BC Canada Weather Forecasts</p>
        </header>
        <div className="setup-card">
          <h2>Set your default city</h2>
          <p>This city will load automatically every time you open the app.</p>
          <form onSubmit={handleSetupSubmit} className="search-row">
            <input
              type="text"
              placeholder="e.g. Vancouver"
              value={setupInput}
              onChange={function (e) { setSetupInput(e.target.value); }}
              autoComplete="off"
              autoFocus
            />
            <button type="submit">Save</button>
          </form>
          <div className="quick-cities">
            {QUICK_CITIES.map(function (c) {
              return (
                <button key={c} type="button" onClick={function () { handleSetupQuick(c); }}>
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header>
        <h1>Weeether</h1>
        <p>BC Canada Weather Forecasts</p>
      </header>

      <div className="search-card">
        <form onSubmit={handleSubmit} className="search-row">
          <input
            type="text"
            placeholder="Enter city (e.g. Vancouver)"
            value={city}
            onChange={function (e) { setCity(e.target.value); }}
            autoComplete="off"
          />
          <button type="submit" disabled={loading}>
            {loading ? '...' : 'Get'}
          </button>
        </form>
        <div className="quick-cities">
          {QUICK_CITIES.map(function (c) {
            return (
              <button key={c} type="button" onClick={function () { handleQuick(c); }}>
                {c}
              </button>
            );
          })}
        </div>
        {error && <div className="error-box">{error}</div>}
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner" />
          Fetching forecast...
        </div>
      )}

      {data && data.current && (
        <>
          <div className="current-card">
            <div className="location">
              {data.current.name}
              {data.current.sys && data.current.sys.country ? ', ' + data.current.sys.country : ''}
            </div>
            <div className="desc">
              {data.current.weather && data.current.weather[0] ? data.current.weather[0].description : ''}
            </div>
            <div className="temp-row">
              {data.current.weather && data.current.weather[0] && (
                <img
                  src={'https://openweathermap.org/img/wn/' + data.current.weather[0].icon + '@2x.png'}
                  alt=""
                  width={80}
                  height={80}
                />
              )}
              <div className="temp">{Math.round(data.current.main.temp)}°</div>
            </div>
            <div className="details">
              <div className="detail-item">
                <div className="label">Feels like</div>
                <div className="value">{Math.round(data.current.main.feels_like)}°C</div>
              </div>
              <div className="detail-item">
                <div className="label">Humidity</div>
                <div className="value">{data.current.main.humidity}%</div>
              </div>
              <div className="detail-item">
                <div className="label">Wind</div>
                <div className="value">{Math.round(data.current.wind.speed)} m/s</div>
              </div>
              <div className="detail-item">
                <div className="label">Pressure</div>
                <div className="value">{data.current.main.pressure} hPa</div>
              </div>
            </div>
          </div>

          {data.daily && data.daily.length > 0 && (
            <div className="forecast-section">
              <h2>5-Day Forecast</h2>
              <div className="forecast-list">
                {data.daily.map(function (day) {
                  return (
                    <div className="forecast-item" key={day.date}>
                      <div className="day">{day.label}</div>
                      <img
                        src={'https://openweathermap.org/img/wn/' + day.icon + '@2x.png'}
                        alt=""
                        width={42}
                        height={42}
                      />
                      <div className="temps">
                        <span className="high">{day.high}°</span>
                        <span className="low">{day.low}°</span>
                      </div>
                      <div className="cond">{day.description}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <footer>Data from OpenWeather · Optimized for BC, Canada</footer>
    </div>
  );
}