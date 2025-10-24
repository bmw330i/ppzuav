/**
 * Paparazzi Mission Planning Types
 * Based on original Paparazzi flight_plan.dtd structure
 */

export interface Position {
  latitude: number;
  longitude: number;
  altitude: number;
}

export interface MissionPlannerState {
  currentPlan: FlightPlan | null;
  homeLocation: Position;
  homeLocationSource: 'ip' | 'gps' | 'manual';
  selectedWaypoint: string | null;
  selectedBlock: string | null;
  editMode: 'view' | 'waypoints' | 'blocks' | 'sectors';
  mapZoom: number;
  mapCenter: Position;
}

export interface Waypoint {
  id: string;
  name: string;
  position: Position;
  // Local coordinates (relative to home)
  x?: number;
  y?: number;
  // Optional height above ground level
  height?: number;
  // Visual properties for map display
  color?: string;
  icon?: string;
  // Actions to perform at this waypoint
  actions?: WaypointAction[];
}

export interface WaypointAction {
  type: 'go' | 'stay' | 'circle' | 'eight' | 'oval' | 'survey_rectangle' | 'home' | 'heading' | 'attitude';
  
  // Common parameters
  radius?: number;
  altitude?: number;
  height?: number;
  vmode?: 'alt' | 'climb' | 'throttle';
  climb?: number;
  throttle?: number;
  pitch?: number;
  
  // Action-specific parameters
  wp?: string; // Target waypoint
  from?: string; // From waypoint
  hmode?: 'route' | 'qdr'; // Horizontal mode
  
  // Circle parameters
  wp_qdr?: number; // Bearing from waypoint
  wp_dist?: number; // Distance from waypoint
  
  // Eight/Oval parameters
  center?: string;
  turn_around?: string;
  p1?: string;
  p2?: string;
  
  // Survey parameters
  grid?: number;
  orientation?: number;
  wp1?: string;
  wp2?: string;
  
  // Timing
  until?: string; // Condition to continue
  approaching_time?: number;
  
  // Navigation
  course?: number; // For heading action
  roll?: number; // For attitude action
}

export interface Block {
  id: string;
  name: string;
  actions: WaypointAction[];
  
  // UI properties
  strip_button?: string;
  strip_icon?: string;
  group?: string;
  key?: string;
  description?: string;
  
  // Callbacks
  pre_call?: string;
  post_call?: string;
}

export interface Exception {
  condition: string;
  deroute: string; // Block to jump to
}

export interface Sector {
  name: string;
  color?: string;
  polygon: Position[];
}

export interface FlightPlan {
  id: string;
  name: string;
  
  // Home position (lat0, lon0)
  home: Position;
  
  // Safety parameters
  max_dist_from_home: number; // meters
  ground_alt: number; // meters
  security_height: number; // meters
  alt: number; // default altitude
  qfu?: number; // runway orientation
  
  // Mission elements
  waypoints: Waypoint[];
  blocks: Block[];
  sectors?: Sector[];
  exceptions?: Exception[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  author?: string;
  description?: string;
}

export interface MissionPlannerState {
  currentPlan: FlightPlan | null;
  homeLocation: Position;
  homeLocationSource: 'ip' | 'gps' | 'manual';
  selectedWaypoint: string | null;
  selectedBlock: string | null;
  editMode: 'view' | 'waypoints' | 'blocks' | 'sectors';
  mapZoom: number;
  mapCenter: Position;
}

export interface ZipcodeLocation {
  zipcode: string;
  city: string;
  state: string;
  country: string;
  position: Position;
}

export interface GeocodeResult {
  success: boolean;
  position?: Position;
  address?: string;
  error?: string;
}

// Pre-defined waypoint action templates
export const WAYPOINT_ACTION_TEMPLATES: Record<string, WaypointAction> = {
  'takeoff': {
    type: 'stay' as const,
    vmode: 'climb' as const,
    climb: 0.5,
    height: 20
  },
  'landing': {
    type: 'stay' as const,
    vmode: 'climb' as const,
    climb: -0.8,
    height: 0
  },
  'circle': {
    type: 'circle' as const,
    radius: 75,
    vmode: 'alt' as const
  },
  'go': {
    type: 'go' as const,
    hmode: 'route' as const,
    vmode: 'alt' as const
  },
  'stay': {
    type: 'stay' as const,
    vmode: 'alt' as const
  },
  'survey': {
    type: 'survey_rectangle' as const,
    grid: 50,
    orientation: 0
  }
};

// Default flight plan template
export const DEFAULT_FLIGHT_PLAN: Partial<FlightPlan> = {
  name: 'New Mission',
  max_dist_from_home: 1000,
  ground_alt: 0,
  security_height: 25,
  alt: 100,
  waypoints: [
    {
      id: 'home',
      name: 'HOME',
      position: { latitude: 0, longitude: 0, altitude: 0 },
      x: 0,
      y: 0,
      color: '#00ff00'
    },
    {
      id: 'stdby',
      name: 'STDBY',
      position: { latitude: 0, longitude: 0, altitude: 100 },
      x: 0,
      y: 75,
      color: '#ffff00'
    }
  ],
  blocks: [
    {
      id: 'standby',
      name: 'Standby',
      actions: [
        {
          type: 'circle',
          wp: 'stdby',
          radius: 75,
          vmode: 'alt'
        }
      ]
    }
  ]
};