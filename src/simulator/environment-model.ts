/**
 * Environment Model - Simulates weather and atmospheric conditions
 * Affects flight dynamics and GPS accuracy
 */

export interface EnvironmentState {
  wind: {
    speed: number; // m/s
    direction: number; // degrees (0-360)
    gusts: number; // m/s
    turbulence: number; // 0-1 intensity
  };
  atmosphere: {
    temperature: number; // Celsius
    pressure: number; // hPa
    humidity: number; // percentage
    density: number; // kg/m³
  };
  visibility: {
    range: number; // meters
    ceiling: number; // meters (cloud base)
  };
  precipitation: {
    type: 'none' | 'rain' | 'snow' | 'hail';
    intensity: number; // 0-1
  };
}

export interface EnvironmentConfig {
  baseWindSpeed: number;
  baseWindDirection: number;
  turbulenceLevel: number;
  temperatureVariation: number;
  weatherChangeRate: number;
}

export class EnvironmentModel {
  private config: EnvironmentConfig;
  private state: EnvironmentState;
  private time: number = 0;

  constructor(config: EnvironmentConfig) {
    this.config = config;
    
    // Initialize atmospheric conditions at sea level, ISA standard
    this.state = {
      wind: {
        speed: config.baseWindSpeed,
        direction: config.baseWindDirection,
        gusts: 0,
        turbulence: config.turbulenceLevel
      },
      atmosphere: {
        temperature: 15.0, // ISA standard temperature
        pressure: 1013.25, // ISA standard pressure
        humidity: 60,
        density: 1.225 // ISA standard density
      },
      visibility: {
        range: 50000, // 50km clear weather
        ceiling: 10000 // 10km no clouds
      },
      precipitation: {
        type: 'none',
        intensity: 0
      }
    };
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    
    // Update wind conditions
    this.updateWind(deltaTime);
    
    // Update atmospheric conditions
    this.updateAtmosphere(deltaTime);
    
    // Update weather patterns
    this.updateWeather(deltaTime);
  }

  private updateWind(deltaTime: number): void {
    // Wind speed variations (realistic wind patterns)
    const windVariation = Math.sin(this.time * 0.1) * 2.0 + 
                         Math.sin(this.time * 0.3) * 1.0;
    this.state.wind.speed = Math.max(0, this.config.baseWindSpeed + windVariation);
    
    // Wind direction changes (gradual shifts)
    const directionVariation = Math.sin(this.time * 0.05) * 15.0; // ±15 degrees
    this.state.wind.direction = (this.config.baseWindDirection + directionVariation + 360) % 360;
    
    // Wind gusts (sudden increases in wind speed)
    if (Math.random() < 0.01) { // 1% chance per update
      this.state.wind.gusts = this.state.wind.speed * (1.2 + Math.random() * 0.8);
    } else {
      this.state.wind.gusts = Math.max(0, this.state.wind.gusts - deltaTime * 5.0);
    }
    
    // Turbulence variations
    const turbulenceNoise = (Math.random() - 0.5) * 0.1;
    this.state.wind.turbulence = Math.max(0, Math.min(1, 
      this.config.turbulenceLevel + turbulenceNoise
    ));
  }

  private updateAtmosphere(deltaTime: number): void {
    // Temperature variations (diurnal cycle simulation)
    const temperatureVariation = Math.sin(this.time * 0.001) * this.config.temperatureVariation;
    this.state.atmosphere.temperature = 15.0 + temperatureVariation;
    
    // Pressure variations (weather systems)
    const pressureVariation = Math.sin(this.time * 0.0005) * 20.0; // ±20 hPa
    this.state.atmosphere.pressure = 1013.25 + pressureVariation;
    
    // Humidity changes
    const humidityVariation = Math.sin(this.time * 0.002) * 20.0;
    this.state.atmosphere.humidity = Math.max(10, Math.min(90, 60 + humidityVariation));
    
    // Air density calculation (function of temperature, pressure, humidity)
    this.calculateAirDensity();
  }

  private calculateAirDensity(): void {
    // Simplified air density calculation
    const T = this.state.atmosphere.temperature + 273.15; // Kelvin
    const P = this.state.atmosphere.pressure * 100; // Pa
    const RH = this.state.atmosphere.humidity / 100; // fraction
    
    // Dry air gas constant
    const Rd = 287.058; // J/(kg·K)
    
    // Water vapor saturation pressure (simplified)
    const es = 611.2 * Math.exp(17.67 * this.state.atmosphere.temperature / 
                                (this.state.atmosphere.temperature + 243.5));
    const e = RH * es; // Actual water vapor pressure
    
    // Virtual temperature (accounts for humidity)
    const Tv = T / (1 - (e / P) * (1 - 0.622));
    
    // Air density
    this.state.atmosphere.density = P / (Rd * Tv);
  }

  private updateWeather(deltaTime: number): void {
    // Simple weather pattern simulation
    const weatherCycle = Math.sin(this.time * this.config.weatherChangeRate);
    
    // Visibility affected by humidity and precipitation
    if (this.state.atmosphere.humidity > 85) {
      this.state.visibility.range = Math.max(1000, 50000 - (this.state.atmosphere.humidity - 85) * 1000);
      this.state.visibility.ceiling = Math.max(200, 10000 - (this.state.atmosphere.humidity - 85) * 200);
    } else {
      this.state.visibility.range = 50000;
      this.state.visibility.ceiling = 10000;
    }
    
    // Precipitation probability
    if (weatherCycle < -0.7 && this.state.atmosphere.humidity > 80) {
      this.state.precipitation.type = 'rain';
      this.state.precipitation.intensity = Math.max(0, Math.min(1, (-weatherCycle - 0.7) * 3));
      
      // Rain affects visibility
      this.state.visibility.range *= (1 - this.state.precipitation.intensity * 0.8);
    } else {
      this.state.precipitation.type = 'none';
      this.state.precipitation.intensity = 0;
    }
  }

  // Get wind vector at specific altitude
  getWindAtAltitude(altitude: number): { u: number; v: number; w: number } {
    // Wind increases with altitude (wind shear)
    const altitudeFactor = Math.min(2.0, 1.0 + altitude / 1000); // Double at 1km
    const effectiveWindSpeed = this.state.wind.speed * altitudeFactor;
    
    // Add gusts
    const totalWindSpeed = effectiveWindSpeed + this.state.wind.gusts;
    
    // Convert to u, v components (meteorological convention)
    const windRad = this.state.wind.direction * Math.PI / 180;
    const u = -totalWindSpeed * Math.sin(windRad); // East component
    const v = -totalWindSpeed * Math.cos(windRad); // North component
    
    // Vertical wind component (turbulence)
    const w = (Math.random() - 0.5) * this.state.wind.turbulence * 5.0; // ±2.5 m/s max
    
    return { u, v, w };
  }

  // Get turbulence intensity at altitude
  getTurbulenceAtAltitude(altitude: number): number {
    // Turbulence often stronger at certain altitudes (jet stream, thermal layers)
    let turbulence = this.state.wind.turbulence;
    
    // Thermal turbulence near ground (up to 3000m)
    if (altitude < 3000) {
      const thermalFactor = 1.0 + (3000 - altitude) / 3000 * 0.5;
      turbulence *= thermalFactor;
    }
    
    // Mountain wave turbulence (simplified)
    if (altitude > 5000 && altitude < 15000) {
      turbulence *= 1.3;
    }
    
    return Math.min(1.0, turbulence);
  }

  // Get air pressure at altitude
  getPressureAtAltitude(altitude: number): number {
    // Barometric formula (simplified)
    const seaLevelPressure = this.state.atmosphere.pressure;
    const pressureAltitude = seaLevelPressure * Math.pow(1 - 0.0065 * altitude / 288.15, 5.255);
    return pressureAltitude;
  }

  // Get temperature at altitude
  getTemperatureAtAltitude(altitude: number): number {
    // Standard lapse rate: -6.5°C per 1000m
    return this.state.atmosphere.temperature - (altitude * 0.0065);
  }

  // Get air density at altitude
  getDensityAtAltitude(altitude: number): number {
    const T = this.getTemperatureAtAltitude(altitude) + 273.15; // Kelvin
    const P = this.getPressureAtAltitude(altitude) * 100; // Pa
    const Rd = 287.058; // J/(kg·K)
    
    return P / (Rd * T);
  }

  // Check if conditions are suitable for flight
  isFlightSafe(): { safe: boolean; reasons: string[] } {
    const reasons: string[] = [];
    
    if (this.state.wind.speed > 15) {
      reasons.push(`High wind speed: ${this.state.wind.speed.toFixed(1)} m/s`);
    }
    
    if (this.state.wind.gusts > 20) {
      reasons.push(`Strong gusts: ${this.state.wind.gusts.toFixed(1)} m/s`);
    }
    
    if (this.state.visibility.range < 5000) {
      reasons.push(`Poor visibility: ${(this.state.visibility.range / 1000).toFixed(1)} km`);
    }
    
    if (this.state.precipitation.intensity > 0.5) {
      reasons.push(`Heavy precipitation: ${this.state.precipitation.type}`);
    }
    
    if (this.state.wind.turbulence > 0.7) {
      reasons.push(`Severe turbulence`);
    }
    
    return {
      safe: reasons.length === 0,
      reasons
    };
  }

  // Simulate weather change
  setWeatherConditions(conditions: Partial<EnvironmentState>): void {
    if (conditions.wind) {
      Object.assign(this.state.wind, conditions.wind);
    }
    if (conditions.atmosphere) {
      Object.assign(this.state.atmosphere, conditions.atmosphere);
    }
    if (conditions.visibility) {
      Object.assign(this.state.visibility, conditions.visibility);
    }
    if (conditions.precipitation) {
      Object.assign(this.state.precipitation, conditions.precipitation);
    }
  }

  getState(): EnvironmentState {
    return JSON.parse(JSON.stringify(this.state)); // Deep copy
  }
}