import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    if (!city || !city.trim()) {
      return NextResponse.json({ error: 'City name is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      console.error('OPENWEATHER_API_KEY is missing or empty');
      return NextResponse.json({ error: 'Weather service is not configured' }, { status: 500 });
    }

    const query = encodeURIComponent(city.trim()) + ',CA';
    const currentUrl = 'https://api.openweathermap.org/data/2.5/weather?q=' + query + '&appid=' + apiKey + '&units=metric';
    const forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast?q=' + query + '&appid=' + apiKey + '&units=metric';

    const [currentRes, forecastRes] = await Promise.all([
      fetch(currentUrl, { next: { revalidate: 300 } }),
      fetch(forecastUrl, { next: { revalidate: 300 } })
    ]);

    if (!currentRes.ok) {
      let errText = '';
      try { errText = await currentRes.text(); } catch (e) {}
      console.error('OpenWeather current error:', currentRes.status, errText);

      if (currentRes.status === 401) {
        return NextResponse.json({ error: 'Invalid weather API key' }, { status: 500 });
      }
      if (currentRes.status === 404) {
        return NextResponse.json({ error: 'City not found. Try a British Columbia city name.' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Unable to fetch weather data (' + currentRes.status + ')' }, { status: 502 });
    }

    const current = await currentRes.json();
    if (!current || !current.main) {
      return NextResponse.json({ error: 'Unexpected weather response' }, { status: 502 });
    }

    let daily = [];
    if (forecastRes.ok) {
      try {
        const forecast = await forecastRes.json();
        daily = processDailyForecast(forecast.list || []);
      } catch (e) {
        console.error('Forecast processing error:', e);
      }
    } else {
      console.error('Forecast status:', forecastRes.status);
    }

    return NextResponse.json({
      current: current,
      daily: daily
    });
  } catch (err) {
    console.error('Unhandled weather route error:', err);
    return NextResponse.json({ error: 'Failed to reach weather service' }, { status: 500 });
  }
}

function processDailyForecast(list) {
  if (!Array.isArray(list) || list.length === 0) return [];

  const byDate = {};

  list.forEach(function (item) {
    if (!item || !item.dt_txt || !item.main) return;
    const date = item.dt_txt.split(' ')[0];
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(item);
  });

  const days = Object.keys(byDate).slice(0, 5);
  const result = [];

  days.forEach(function (date) {
    const entries = byDate[date];
    if (!entries || entries.length === 0) return;

    let best = entries[0];
    let bestDiff = 99;

    entries.forEach(function (e) {
      const parts = e.dt_txt.split(' ');
      if (parts.length < 2) return;
      const hour = parseInt(parts[1].split(':')[0], 10);
      const diff = Math.abs(hour - 12);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = e;
      }
    });

    let high = -999;
    let low = 999;
    entries.forEach(function (e) {
      if (typeof e.main.temp_max === 'number' && e.main.temp_max > high) high = e.main.temp_max;
      if (typeof e.main.temp_min === 'number' && e.main.temp_min < low) low = e.main.temp_min;
    });

    const d = new Date(date + 'T12:00:00');
    const label = d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });

    const icon = (best.weather && best.weather[0] && best.weather[0].icon) ? best.weather[0].icon : '01d';
    const description = (best.weather && best.weather[0] && best.weather[0].description) ? best.weather[0].description : '';

    result.push({
      date: date,
      label: label,
      high: Math.round(high),
      low: Math.round(low),
      icon: icon,
      description: description
    });
  });

  return result;
}