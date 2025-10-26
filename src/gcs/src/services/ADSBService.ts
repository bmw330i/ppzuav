import type { Position } from '../types/core';

export interface ADSBAircraft {
  icao: string;           // ICAO hex code (unique identifier)
  callsign: string;       // Flight callsign
  position: Position;     // Current position
  velocity: {
    speed: number;        // Ground speed in m/s
    track: number;        // Track angle in degrees
    verticalRate: number; // Vertical rate in m/s
  };
  squawk: string;         // Transponder squawk code
  category: string;       // Aircraft category
  lastSeen: number;       // Timestamp of last message
  altitude: number;       // Altitude in meters
  onGround: boolean;      // Whether aircraft is on ground
  emergency: boolean;     // Emergency status
  source: 'adsb' | 'mode_s' | 'mlat';
}

export interface CollisionWarning {
  targetIcao: string;
  targetCallsign: string;
  distance: number;       // Distance in meters
  altitude: number;       // Relative altitude in meters
  timeToClosestApproach: number; // Seconds
  severity: 'low' | 'medium' | 'high' | 'critical';
  bearing: number;        // Bearing to target in degrees
}

export class ADSBService {
  private static instance: ADSBService;
  private aircraft: Map<string, ADSBAircraft> = new Map();
  private listeners: Set<(aircraft: ADSBAircraft[]) => void> = new Set();
  private collisionListeners: Set<(warnings: CollisionWarning[]) => void> = new Set();
  private websocket: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connected: boolean = false;
  private ownPosition: Position | null = null;
  private ownAltitude: number = 0;

  // ADS-B receiver endpoints (multiple sources for redundancy)
  private readonly endpoints = [
    'ws://localhost:30003',      // dump1090 WebSocket
    'ws://localhost:8080/adsb',  // RTL-SDR ADS-B receiver
    'ws://localhost:3001/adsb',  // Custom ADS-B server
  ];
  private currentEndpointIndex = 0;

  private constructor() {
    this.connect();
    this.startCleanupTimer();
    this.startCollisionMonitoring();
  }

  public static getInstance(): ADSBService {
    if (!ADSBService.instance) {
      ADSBService.instance = new ADSBService();
    }
    return ADSBService.instance;
  }

  private connect(): void {
    const endpoint = this.endpoints[this.currentEndpointIndex];
    console.log(`🔗 [ADS-B] Attempting to connect to receiver at ${endpoint}`);

    try {
      this.websocket = new WebSocket(endpoint);

      this.websocket.onopen = () => {
        console.log(`✅ [ADS-B] Connected to receiver at ${endpoint}`);
        this.connected = true;
        this.currentEndpointIndex = 0; // Reset to first endpoint on successful connection
        
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`📡 [ADS-B] Received message:`, data);
          this.processADSBMessage(data);
        } catch (error) {
          console.error('❌ [ADS-B] Error parsing message:', error);
        }
      };

      this.websocket.onclose = (event) => {
        console.log(`🔌 [ADS-B] Connection closed (code: ${event.code}, reason: ${event.reason})`);
        this.connected = false;
        this.scheduleReconnect();
      };

      this.websocket.onerror = (error) => {
        console.error(`❌ [ADS-B] WebSocket error at ${endpoint}:`, error);
        this.connected = false;
      };

    } catch (error) {
      console.error(`❌ [ADS-B] Failed to create WebSocket for ${endpoint}:`, error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    const nextEndpoint = this.endpoints[(this.currentEndpointIndex + 1) % this.endpoints.length];
    console.log(`🔄 [ADS-B] Scheduling reconnect to next endpoint: ${nextEndpoint} in 5 seconds...`);

    this.reconnectTimer = setTimeout(() => {
      this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.endpoints.length;
      this.connect();
    }, 5000); // Reconnect after 5 seconds
  }

  private processADSBMessage(data: any): void {
    // Handle different ADS-B message formats
    if (data.type === 'aircraft') {
      this.updateAircraft(data);
    } else if (data.icao) {
      // Direct aircraft data
      this.updateAircraft(data);
    }
  }

  private updateAircraft(data: any): void {
    const aircraft: ADSBAircraft = {
      icao: data.icao || data.hex,
      callsign: (data.callsign || data.flight || 'Unknown').trim(),
      position: {
        latitude: data.lat || data.latitude || 0,
        longitude: data.lon || data.longitude || 0,
        altitude: data.alt_baro || data.altitude || 0
      },
      velocity: {
        speed: (data.gs || data.speed || 0) * 0.514444, // Convert knots to m/s
        track: data.track || data.heading || 0,
        verticalRate: (data.baro_rate || data.vert_rate || 0) * 0.00508 // Convert ft/min to m/s
      },
      squawk: data.squawk || '',
      category: this.getCategoryFromType(data.category || data.type),
      lastSeen: Date.now(),
      altitude: data.alt_baro || data.altitude || 0,
      onGround: data.on_ground || false,
      emergency: data.emergency || false,
      source: 'adsb'
    };

    // Only update if we have valid position data
    if (aircraft.position.latitude !== 0 && aircraft.position.longitude !== 0) {
      this.aircraft.set(aircraft.icao, aircraft);
      this.notifyListeners();
    }
  }

  private getCategoryFromType(type: string): string {
    const categories: { [key: string]: string } = {
      'A1': 'Light Aircraft',
      'A2': 'Small Aircraft',
      'A3': 'Large Aircraft',
      'A4': 'High Vortex Aircraft',
      'A5': 'Heavy Aircraft',
      'A6': 'High Performance',
      'A7': 'Helicopter',
      'B1': 'Glider',
      'B2': 'Balloon',
      'B3': 'Parachutist',
      'B4': 'Ultralight',
      'C1': 'Emergency Vehicle',
      'C2': 'Service Vehicle',
      'C3': 'Ground Obstacle'
    };
    return categories[type] || 'Unknown';
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      const now = Date.now();
      const staleThreshold = 60000; // 60 seconds

      const aircraftEntries = Array.from(this.aircraft.entries());
      for (const [icao, aircraft] of aircraftEntries) {
        if (now - aircraft.lastSeen > staleThreshold) {
          this.aircraft.delete(icao);
        }
      }

      this.notifyListeners();
    }, 10000); // Cleanup every 10 seconds
  }

  private startCollisionMonitoring(): void {
    setInterval(() => {
      if (this.ownPosition) {
        const warnings = this.calculateCollisionWarnings();
        this.notifyCollisionListeners(warnings);
      }
    }, 1000); // Check every second
  }

  private calculateCollisionWarnings(): CollisionWarning[] {
    if (!this.ownPosition) return [];

    const warnings: CollisionWarning[] = [];
    const criticalDistance = 1000;  // 1km
    const warningDistance = 2000;   // 2km
    const alertDistance = 5000;     // 5km

    const aircraftList = Array.from(this.aircraft.values());
    for (const aircraft of aircraftList) {
      if (aircraft.onGround) continue;

      const distance = this.calculateDistance(this.ownPosition, aircraft.position);
      const altitudeDiff = Math.abs(aircraft.altitude - this.ownAltitude);
      const bearing = this.calculateBearing(this.ownPosition, aircraft.position);

      // Only warn if aircraft is within reasonable altitude range (±500m)
      if (altitudeDiff > 500) continue;

      let severity: CollisionWarning['severity'] = 'low';
      if (distance < criticalDistance) severity = 'critical';
      else if (distance < warningDistance) severity = 'high';
      else if (distance < alertDistance) severity = 'medium';
      else continue;

      // Calculate time to closest approach (simplified)
      const relativeSpeed = Math.abs(aircraft.velocity.speed - 20); // Assume our speed is 20 m/s
      const timeToClosestApproach = distance / Math.max(relativeSpeed, 1);

      warnings.push({
        targetIcao: aircraft.icao,
        targetCallsign: aircraft.callsign,
        distance,
        altitude: altitudeDiff,
        timeToClosestApproach,
        severity,
        bearing
      });
    }

    return warnings.sort((a, b) => a.distance - b.distance);
  }

  private calculateDistance(pos1: Position, pos2: Position): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(pos2.latitude - pos1.latitude);
    const dLon = this.toRadians(pos2.longitude - pos1.longitude);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(pos1.latitude)) * Math.cos(this.toRadians(pos2.latitude)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private calculateBearing(pos1: Position, pos2: Position): number {
    const dLon = this.toRadians(pos2.longitude - pos1.longitude);
    const lat1 = this.toRadians(pos1.latitude);
    const lat2 = this.toRadians(pos2.latitude);
    
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    
    return (this.toDegrees(Math.atan2(y, x)) + 360) % 360;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  public updateOwnPosition(position: Position, altitude: number): void {
    this.ownPosition = position;
    this.ownAltitude = altitude;
  }

  public getAircraft(): ADSBAircraft[] {
    return Array.from(this.aircraft.values());
  }

  public getAircraftInRadius(center: Position, radiusKm: number): ADSBAircraft[] {
    return this.getAircraft().filter(aircraft => {
      const distance = this.calculateDistance(center, aircraft.position);
      return distance <= radiusKm * 1000; // Convert km to meters
    });
  }

  public onAircraftUpdate(callback: (aircraft: ADSBAircraft[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public onCollisionWarning(callback: (warnings: CollisionWarning[]) => void): () => void {
    this.collisionListeners.add(callback);
    return () => this.collisionListeners.delete(callback);
  }

  private notifyListeners(): void {
    const aircraft = this.getAircraft();
    this.listeners.forEach(callback => callback(aircraft));
  }

  private notifyCollisionListeners(warnings: CollisionWarning[]): void {
    this.collisionListeners.forEach(callback => callback(warnings));
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.connected = false;
  }

  // Demo mode - generate fake ADS-B traffic for testing
  public startDemoMode(): void {
    console.log('🎮 [ADS-B] Starting demo mode with simulated aircraft traffic');
    
    const generateDemoAircraft = () => {
      const basePosition = { latitude: 48.8566, longitude: 2.3522, altitude: 0 }; // Paris
      const aircraftTypes = ['Air France', 'Lufthansa', 'British Airways', 'KLM', 'Emirates'];
      
      for (let i = 0; i < 5; i++) {
        const aircraft: ADSBAircraft = {
          icao: `DEMO${i.toString().padStart(2, '0')}`,
          callsign: `${aircraftTypes[i % aircraftTypes.length]}${(100 + i).toString()}`,
          position: {
            latitude: basePosition.latitude + (Math.random() - 0.5) * 0.1,
            longitude: basePosition.longitude + (Math.random() - 0.5) * 0.1,
            altitude: Math.random() * 12000 + 1000 // 1000-13000m
          },
          velocity: {
            speed: Math.random() * 150 + 50, // 50-200 m/s
            track: Math.random() * 360,
            verticalRate: (Math.random() - 0.5) * 10 // ±5 m/s
          },
          squawk: Math.floor(Math.random() * 7777).toString(),
          category: 'Large Aircraft',
          lastSeen: Date.now(),
          altitude: Math.random() * 12000 + 1000,
          onGround: false,
          emergency: Math.random() < 0.1, // 10% chance of emergency
          source: 'adsb'
        };
        
        this.aircraft.set(aircraft.icao, aircraft);
      }
      
      console.log(`🎮 [ADS-B] Generated ${this.aircraft.size} demo aircraft`);
      this.notifyListeners();
    };

    // Generate initial demo aircraft
    generateDemoAircraft();
    
    // Update demo aircraft positions every 2 seconds
    setInterval(() => {
      const demoAircraftList = Array.from(this.aircraft.values());
      for (const aircraft of demoAircraftList) {
        if (aircraft.icao.startsWith('DEMO')) {
          // Update position based on velocity
          const speedKmH = aircraft.velocity.speed * 3.6;
          const distanceKm = speedKmH / 3600 * 2; // Distance in 2 seconds
          
          const deltaLat = distanceKm * Math.cos(this.toRadians(aircraft.velocity.track)) / 111.32;
          const deltaLon = distanceKm * Math.sin(this.toRadians(aircraft.velocity.track)) / (111.32 * Math.cos(this.toRadians(aircraft.position.latitude)));
          
          aircraft.position.latitude += deltaLat;
          aircraft.position.longitude += deltaLon;
          aircraft.position.altitude += aircraft.velocity.verticalRate * 2;
          aircraft.lastSeen = Date.now();
        }
      }
      this.notifyListeners();
    }, 2000);
  }
}