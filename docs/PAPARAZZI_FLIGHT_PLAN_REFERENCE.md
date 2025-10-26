# Paparazzi Flight Plan Reference

This document provides a comprehensive reference for all Paparazzi flight plan functions, waypoint types, block actions, and mission capabilities extracted from the source code and official Wiki documentation. This serves as a specification for implementing these features in the new GCS.

**Sources:**
- Paparazzi source code analysis
- Official Wiki: https://wiki.paparazziuav.org/wiki/Flight_Plans
- DTD schema: `conf/flight_plans/flight_plan.dtd`

## Table of Contents

1. [Flight Plan Structure](#flight-plan-structure)
2. [Waypoint System](#waypoint-system)
3. [Block Actions](#block-actions)
4. [Navigation Functions](#navigation-functions)
5. [Vertical Modes](#vertical-modes)
6. [Horizontal Modes](#horizontal-modes)
7. [Variables and Procedures](#variables-and-procedures)
8. [Safety Features](#safety-features)
9. [Advanced Features](#advanced-features)
10. [Implementation Priority](#implementation-priority)

## Flight Plan Structure

Based on `flight_plan.dtd`, a Paparazzi flight plan consists of:

```xml
<!ELEMENT flight_plan (header?,waypoints,sectors?,variables?,includes?,exceptions?,blocks)>
```

### Core Attributes
```xml
<!ATTLIST flight_plan
  name CDATA #REQUIRED            // Flight plan name
  lat0 CDATA #REQUIRED            // Home latitude (degrees WGS84)
  lon0 CDATA #REQUIRED            // Home longitude (degrees WGS84)
  max_dist_from_home CDATA #REQUIRED  // Maximum distance from home (meters)
  ground_alt CDATA #REQUIRED      // Ground altitude MSL (meters)
  security_height CDATA #REQUIRED // Minimum safety height above ground
  alt CDATA #REQUIRED             // Default altitude MSL (meters)
  qfu CDATA #IMPLIED              // Runway orientation (degrees, magnetic)
  home_mode_height CDATA #IMPLIED>// Override security_height for home mode (v4.2+)
```

**Attribute Details:**
- **lat0, lon0**: Reference point {0,0} coordinates in WGS84 degrees
- **ground_alt**: Ground elevation MSL - defines GROUND_ALT constant
- **security_height**: Height over ground_alt for circle-home failsafe and collision avoidance
- **home_mode_height**: Optional override for security_height in home mode (v4.2+)
- **qfu**: Magnetic heading of runway (north=0°, east=90°), used by simulator for takeoff heading
- **alt**: Default waypoint altitude MSL (must be > ground_alt + obstructions)
- **max_dist_from_home**: Safety radius triggering exceptions when exceeded

### JSON Schema for New GCS
```json
{
  "id": "string",
  "name": "string",
  "lat0": "number",              // Home latitude WGS84
  "lon0": "number",              // Home longitude WGS84
  "max_dist_from_home": "number", // Safety radius (meters)
  "ground_alt": "number",        // Ground elevation MSL
  "security_height": "number",   // Minimum AGL safety height
  "alt": "number",               // Default altitude MSL
  "qfu": "number?",              // Runway magnetic heading (optional)
  "home_mode_height": "number?", // Home mode height override (optional)
  "waypoints": "Waypoint[]",
  "blocks": "Block[]",
  "sectors": "Sector[]?",
  "variables": "Variable[]?",    // Flight plan variables (v5.9+)
  "includes": "Include[]?",      // Procedure includes
  "exceptions": "Exception[]?",
  "modules": "Module[]?",        // Additional modules
  "header": "string?",           // C header includes
  "metadata": {
    "created_at": "string",
    "updated_at": "string",
    "author": "string?"
  }
}
```

## Waypoint System

### Waypoint Definition
```xml
<!ATTLIST waypoint
  name CDATA #REQUIRED    // Unique waypoint identifier
  x CDATA #IMPLIED        // Local X coordinate (meters from home)
  y CDATA #IMPLIED        // Local Y coordinate (meters from home)
  lat CDATA #IMPLIED      // Latitude (degrees WGS84, alternative to x/y)
  lon CDATA #IMPLIED      // Longitude (degrees WGS84, alternative to x/y)
  alt CDATA #IMPLIED      // Altitude MSL (meters)
  height CDATA #IMPLIED>  // Height AGL (meters, alternative to alt)
```

**Coordinate Systems:**
1. **Geographic**: `lat`/`lon` in WGS84 degrees
2. **Local**: `x`/`y` in meters relative to home (x=east, y=north)
3. **UTM**: `utm_x0`/`utm_y0` for UTM coordinates
4. **Altitude**: `alt` (MSL) or `height` (AGL relative to ground_alt)

**Examples:**
```xml
<waypoint name="HOME" x="0.0" y="30.0"/>
<waypoint name="TOWER" lat="48.858249" lon="2.294494" height="324"/>
<waypoint name="BARN" x="-130.0" y="217.5" alt="ground_alt + 50"/>
<waypoint name="MountainCAFE" utm_x0="360284.8" utm_y0="4813595.5" alt="1965"/>
```

### Special Waypoints
- **HOME**: Always required, defines mission origin (lat0, lon0)
- **STDBY**: Common standby/loiter waypoint
- **AF**: Approach Fix for landing
- **TD**: Touch Down point for landing
- **BASELEG**: Automatically computed landing waypoint
- **_PREFIX**: Waypoints starting with underscore are hidden in GCS (except editor mode)

### Waypoint Limits and Tips
- **Maximum waypoints**: 254
- **Waypoint references**: Use `WP_` prefix for function calls (e.g., `WP_HOME`)
- **Hidden waypoints**: Names starting with `_` are not displayed in GCS
- **Required waypoints**: HOME is required for failsafe HOME mode procedure

### Waypoint Coordinate Systems
1. **Geographic**: `lat`/`lon` in degrees
2. **Local**: `x`/`y` in meters relative to home
3. **Altitude**: `alt` (MSL) or `height` (AGL)

### Implementation for New GCS
```typescript
interface Waypoint {
  id: string;
  name: string;
  position: {
    latitude: number;    // Always stored in geographic
    longitude: number;   // Always stored in geographic
    altitude: number;    // MSL altitude
  };
  localPosition?: {      // Computed from geographic
    x: number;           // Meters east of home
    y: number;           // Meters north of home
  };
  height?: number;       // AGL height (alternative to altitude)
  type: 'home' | 'waypoint' | 'approach' | 'touchdown' | 'standby';
}
```

## Block Actions

Blocks are named sequences of actions that define aircraft behavior. Each block can contain multiple action types.

### Core Block Structure
```xml
<!ATTLIST block 
  name CDATA #REQUIRED
  pre_call CDATA #IMPLIED      // C function called on block entry
  post_call CDATA #IMPLIED     // C function called on block exit
  strip_button CDATA #IMPLIED  // GCS button label
  strip_icon CDATA #IMPLIED    // GCS button icon
  group CDATA #IMPLIED         // Button group for organization
  key CDATA #IMPLIED          // Keyboard shortcut
  description CDATA #IMPLIED>  // Block description
```

### 1. **GO Action** - Navigate to Waypoint
```xml
<go wp="waypoint_name"
     from="start_waypoint"      // Optional starting point
     wp_qdr="bearing"           // Bearing from waypoint (degrees)
     wp_dist="distance"         // Distance from waypoint (meters)
     from_qdr="bearing"         // Bearing from 'from' waypoint
     from_dist="distance"       // Distance from 'from' waypoint
     hmode="route|qdr"          // Horizontal navigation mode
     vmode="alt|climb|throttle|glide" // Vertical mode
     alt="altitude"             // Target altitude MSL
     height="height_agl"        // Target height AGL
     pitch="pitch_angle"        // Pitch angle (degrees)
     throttle="throttle_setting" // Throttle 0.0-1.0
     climb="climb_rate"         // Climb rate (m/s)
     approaching_time="seconds"/> // Time before waypoint to trigger next stage
```

**Implementation Priority: HIGH** - Core navigation function
```typescript
interface GoAction {
  type: 'go';
  wp: string;                    // Target waypoint ID
  from?: string;                 // Starting waypoint ID
  wp_qdr?: number;              // Bearing from target waypoint
  wp_dist?: number;             // Distance from target waypoint
  from_qdr?: number;            // Bearing from start waypoint
  from_dist?: number;           // Distance from start waypoint
  hmode?: 'route' | 'qdr';      // Horizontal mode
  vmode?: 'alt' | 'climb' | 'throttle' | 'glide';
  alt?: number;
  height?: number;
  pitch?: number;
  throttle?: number;
  climb?: number;
  approaching_time?: number;
}
```

### 2. **CIRCLE Action** - Circle Around Point
```xml
<circle wp="waypoint_name"
        radius="radius_meters"   // Circle radius (positive = right, negative = left)
        wp_qdr="bearing"         // Bearing from waypoint
        wp_dist="distance"       // Distance from waypoint
        alt="altitude"
        height="height_agl"
        vmode="alt|climb|throttle"
        climb="climb_rate"
        pitch="pitch_angle"
        throttle="throttle_setting"
        until="condition"/>      // Exit condition
```

**Implementation Priority: HIGH** - Essential for loitering
```typescript
interface CircleAction {
  type: 'circle';
  wp: string;
  radius: number;               // Meters (positive = clockwise)
  wp_qdr?: number;
  wp_dist?: number;
  alt?: number;
  height?: number;
  vmode?: 'alt' | 'climb' | 'throttle';
  climb?: number;
  pitch?: number;
  throttle?: number;
  until?: string;               // Exit condition expression
}
```

### 3. **EIGHT Action** - Figure-8 Pattern
```xml
<eight center="waypoint_name"
       turn_around="waypoint_name"
       radius="radius_meters"
       alt="altitude"
       vmode="alt|climb|throttle"
       climb="climb_rate"
       pitch="pitch_angle"
       throttle="throttle_setting"
       until="condition"/>
```

**Implementation Priority: MEDIUM** - Advanced pattern
```typescript
interface EightAction {
  type: 'eight';
  center: string;               // Center waypoint
  turn_around: string;          // Turn-around waypoint
  radius: number;
  alt?: number;
  vmode?: 'alt' | 'climb' | 'throttle';
  climb?: number;
  pitch?: number;
  throttle?: number;
  until?: string;
}
```

### 4. **OVAL Action** - Oval Pattern Between Points
```xml
<oval p1="waypoint_name"
      p2="waypoint_name"
      radius="radius_meters"
      alt="altitude"
      vmode="alt|climb|throttle"
      climb="climb_rate"
      pitch="pitch_angle"
      throttle="throttle_setting"
      until="condition"/>
```

**Implementation Priority: MEDIUM** - Advanced pattern
```typescript
interface OvalAction {
  type: 'oval';
  p1: string;                   // First endpoint
  p2: string;                   // Second endpoint
  radius: number;               // Turn radius at endpoints
  alt?: number;
  vmode?: 'alt' | 'climb' | 'throttle';
  climb?: number;
  pitch?: number;
  throttle?: number;
  until?: string;
}
```

### 5. **SURVEY_RECTANGLE Action** - Automated Survey
```xml
<survey_rectangle wp1="corner1"
                  wp2="corner2"
                  grid="spacing_meters"
                  orientation="angle_degrees"/> // Optional: NS or WE
```

**Implementation Priority: HIGH** - Critical for mapping missions
```typescript
interface SurveyRectangleAction {
  type: 'survey_rectangle';
  wp1: string;                  // First corner waypoint
  wp2: string;                  // Opposite corner waypoint
  grid: number;                 // Line spacing in meters
  orientation?: number | 'NS' | 'WE'; // Survey line direction
}
```

### 6. **PATH Action** - Sequential Waypoint Navigation
```xml
<path wpts="wp1,wp2 wp3,wp4 wp5"  // Space-separated waypoint groups
      vmode="alt|climb|throttle"
      pitch="pitch_angle"
      alt="altitude"
      approaching_time="seconds"
      throttle="throttle_setting"
      climb="climb_rate"/>
```

**Implementation Priority: HIGH** - Multi-waypoint navigation
```typescript
interface PathAction {
  type: 'path';
  wpts: string;                 // Comma/space separated waypoint names
  vmode?: 'alt' | 'climb' | 'throttle';
  pitch?: number;
  alt?: number;
  approaching_time?: number;
  throttle?: number;
  climb?: number;
}
```

### 7. **HEADING Action** - Fly Specific Heading
```xml
<heading course="heading_degrees"
         vmode="alt|climb|throttle"
         alt="altitude"
         height="height_agl"
         throttle="throttle_setting"
         climb="climb_rate"
         pitch="pitch_angle"
         until="condition"/>
```

**Implementation Priority: MEDIUM** - Directional flight
```typescript
interface HeadingAction {
  type: 'heading';
  course: number;               // Heading in degrees
  vmode?: 'alt' | 'climb' | 'throttle';
  alt?: number;
  height?: number;
  throttle?: number;
  climb?: number;
  pitch?: number;
  until: string;                // Required exit condition
}
```

### 8. **ATTITUDE Action** - Manual Attitude Control
```xml
<attitude roll="roll_degrees"
          vmode="alt|climb|throttle"
          alt="altitude"
          height="height_agl"
          throttle="throttle_setting"
          climb="climb_rate"
          pitch="pitch_angle"
          until="condition"/>
```

**Implementation Priority: LOW** - Manual control
```typescript
interface AttitudeAction {
  type: 'attitude';
  roll: number;                 // Roll angle in degrees
  vmode?: 'alt' | 'climb' | 'throttle';
  alt?: number;
  height?: number;
  throttle?: number;
  climb?: number;
  pitch?: number;
  until?: string;               // Exit condition (optional)
}
```

### 9. **STAY Action** - Loiter at Waypoint
```xml
<stay wp="waypoint_name"
      vmode="alt|climb|throttle"
      throttle="throttle_setting"
      climb="climb_rate"
      alt="altitude"
      height="height_agl"
      until="condition"/>
```

**Implementation Priority: MEDIUM** - Position holding
```typescript
interface StayAction {
  type: 'stay';
  wp: string;
  vmode?: 'alt' | 'climb' | 'throttle';
  throttle?: number;
  climb?: number;
  alt?: number;
  height?: number;
  until?: string;
}
```

### 10. **HOME Action** - Return to Home
```xml
<home/>
```

**Implementation Priority: HIGH** - Safety function
```typescript
interface HomeAction {
  type: 'home';
  // No additional parameters - uses built-in RTH logic
}
```

### 11. **XYZ Action** - 3D Coordinate Navigation
```xml
<xyz radius="radius_meters"/>
```

**Implementation Priority: LOW** - Advanced 3D control
```typescript
interface XyzAction {
  type: 'xyz';
  radius?: number;
}
```

### 12. **FOLLOW Action** - Follow Another Aircraft
```xml
<follow ac_id="aircraft_id"
        distance="distance_meters"
        height="height_difference"/>
```

**Implementation Priority: LOW** - Multi-aircraft operations
```typescript
interface FollowAction {
  type: 'follow';
  ac_id: string;                // Target aircraft ID
  distance: number;             // Following distance
  height: number;               // Height offset
}
```

### 20. **RETURN Action** - Return from Procedure
```xml
<return/>
```

**Implementation Priority: LOW** - Procedure support
```typescript
interface ReturnAction {
  type: 'return';
}
```

## Variables and Procedures

### Flight Plan Variables (v5.9+)
Flight plans can declare variables that become available throughout the system:

```xml
<variables>
  <variable var="my_var"/>                    <!-- float, default 0 -->
  <variable var="my_int" init="10" type="int"/>
  <variable var="setting_var" min="0." max="10." step="0.1" 
            shortname="MyVar" unit="m/s"/>    <!-- Creates GCS setting -->
</variables>
```

**Variable Attributes:**
- `var`: Variable name
- `type`: `float` (default), `int`, `bool`
- `init`: Initial value (default: 0)
- `min`/`max`/`step`: Creates automatic GCS setting
- `shortname`/`unit`/`alt_unit`: Setting display options

### Procedures and Includes
Reusable flight plan components:

```xml
<includes>
  <include name="landing" procedure="landing.xml">
    <arg name="approach_alt" value="100"/>
    <with from="go_around" to="Standby"/>
  </include>
</includes>
```

**Procedure Structure:**
```xml
<!DOCTYPE procedure SYSTEM "flight_plan.dtd">
<procedure>
  <param name="alt"/>                         <!-- Required parameter -->
  <param name="radius" default_value="75"/>   <!-- Optional parameter -->
  <waypoints>...</waypoints>
  <blocks>...</blocks>
</procedure>
```

### Additional Modules
Modules can be included in flight plans:

```xml
<modules>
  <module name="demo_module">
    <define name="MY_DEFINE" value="0"/>
    <configure name="MY_CONF" value="0"/>
  </module>
</modules>
```

### 13. **SET Action** - Set Variable
```xml
<set var="variable_name" value="value"/>
```

**Implementation Priority: MEDIUM** - State management
```typescript
interface SetAction {
  type: 'set';
  var: string;                  // Variable name
  value: string;                // Value expression
}
```

### 14. **CALL Action** - Function Call
```xml
<call fun="function_name()"/>
```

**Implementation Priority: MEDIUM** - Custom functions
```typescript
interface CallAction {
  type: 'call';
  fun: string;                  // Function call with parameters
}
```

### 15. **WHILE Action** - Loop Structure
```xml
<while cond="condition">
  <!-- nested actions -->
</while>
```

**Implementation Priority: MEDIUM** - Flow control
```typescript
interface WhileAction {
  type: 'while';
  cond?: string;                // Loop condition (default: TRUE)
  actions: Action[];            // Nested actions
}
```

### 16. **FOR Action** - Counted Loop
```xml
<for var="loop_variable" from="start_value" to="end_value">
  <!-- nested actions -->
</for>
```

**Implementation Priority: MEDIUM** - Counted iterations
```typescript
interface ForAction {
  type: 'for';
  var: string;                  // Loop variable name
  from: string;                 // Start value
  to: string;                   // End value
  actions: Action[];            // Nested actions
}
```

### 17. **DEROUTE Action** - Jump to Block
```xml
<deroute block="block_name"/>
```

**Implementation Priority: HIGH** - Essential for mission flow
```typescript
interface DerouteAction {
  type: 'deroute';
  block: string;                // Target block name
}
```

### 18. **ABIDE Action** - Enhanced Stay for Hybrid Aircraft
```xml
<abide wp="waypoint_name"
      alt="altitude"/>
```

**Implementation Priority: LOW** - Similar to STAY but optimized for hybrid aircraft
```typescript
interface AbideAction {
  type: 'abide';
  wp: string;
  alt?: number;
  // Similar to STAY but better for hybrid/VTOL aircraft
}
```

### 19. **CALL_ONCE Action** - Single Function Call
```xml
<call_once fun="function_name()"/>
```

**Implementation Priority: MEDIUM** - Execute function exactly once
```typescript
interface CallOnceAction {
  type: 'call_once';
  fun: string;                  // Function call executed once regardless of return value
}
```

## Vertical Modes (vmode)

Vertical flight control modes determine how the aircraft manages altitude:

1. **alt** - Maintain specific altitude (MSL)
2. **climb** - Maintain climb rate (m/s)
3. **throttle** - Manual throttle control (0.0-1.0)
4. **glide** - Glide descent (pitch for speed)

```typescript
type VerticalMode = 'alt' | 'climb' | 'throttle' | 'glide';
```

## Horizontal Modes (hmode)

Horizontal navigation modes:

1. **route** - Direct route between waypoints
2. **qdr** - Navigate on specific bearing

```typescript
type HorizontalMode = 'route' | 'qdr';
```

## Safety Features

### Exceptions
Global or block-level conditions that trigger automatic block changes:

```xml
<exception cond="condition_expression" deroute="target_block"/>
```

**Examples:**
- `datalink_time > 22` - Communication timeout
- `estimator_z > ground_alt+25` - Altitude safety
- `10 > PowerVoltage()` - Low battery
- `ground_alt + 10 > estimator_z` - Near ground

### Sectors (No-Fly Zones)
```xml
<sector name="sector_name" color="color">
  <corner name="waypoint1"/>
  <corner name="waypoint2"/>
  <corner name="waypoint3"/>
</sector>
```

### Safety Parameters
- `max_dist_from_home` - Maximum distance from home position
- `security_height` - Minimum height above ground
- `ground_alt` - Ground elevation for safety calculations

## Advanced Features

### 1. **Standard Initialization Blocks**
Most flight plans should include these three initialization blocks:

**Wait GPS Block:**
```xml
<block name="Wait GPS">
  <set value="1" var="kill_throttle"/>
  <while cond="!GpsFixValid()"/>
</block>
```

**Geo Init Block:**
```xml
<block name="Geo init">
  <while cond="LessThan(NavBlockTime(), 10)"/>
  <call fun="NavSetGroundReferenceHere()"/>
</block>
```

**Holding Point Block:**
```xml
<block name="Holding point">
  <set value="1" var="kill_throttle"/>
  <attitude roll="0" throttle="0" vmode="throttle"/>
</block>
```

### 2. **Expression System**
Flight plan expressions support:

**Operators:**
- Numeric: `+`, `-`, `*`, `/`
- Comparison: `<`, `>`, `<=`, `>=`, `==`, `<>`
- Logical: `&&` (`@AND`), `||` (`@OR`)
- XML-safe alternatives: `@LT`, `@GT`, `@LEQ`, `@GEQ`, `@DEREF`

**Loop Variables:**
```xml
<for var="i" from="1" to="5">
  <circle wp="HOME" radius="75" alt="ground_alt+50*$i" until="stage_time>10"/>
</for>
```

### 3. **Navigation Functions** (accessed via CALL actions)
- `NavSetGroundReferenceHere()` - Set local coordinate origin
- `NavSetAltitudeReferenceHere()` - Reset altitude reference only
- `NavSetWaypointHere(WP_ID)` - Move waypoint to current position
- `nav_compute_baseleg()` - Calculate landing approach
- `nav_line_init()` / `nav_line()` - Line following
- `NavQdrCloseTo()` - Bearing proximity check
- `NavCircleCount()` - Circle turn counter
- `NavKillThrottle()` - Emergency throttle cut

### 4. **Pre-defined Variables and Functions**
**Time Variables:**
- `autopilot_flight_time` - Seconds since autopilot boot (integer)
- `datalink_time` - Seconds since last telemetry connection (integer)
- `stage_time` - Time in current stage (seconds)
- `NavBlockTime()` - Time in current block (seconds)

**Position Functions:**
- `GetPosAlt()` - Current altitude AGL (meters, float)
- `GetPosX()` - Current X position relative to reference (meters, float)
- `GetPosY()` - Current Y position relative to reference (meters, float)
- `GetAltRef()` - Reference altitude (replaces ground_alt in v5.8+)

**Waypoint Functions:**
- `WaypointX(wp)` - Waypoint X coordinate (meters, float)
- `WaypointY(wp)` - Waypoint Y coordinate (meters, float)
- `WaypointAlt(wp)` - Waypoint altitude (meters, float)

**System Functions:**
- `PowerVoltage()` - Current battery voltage
- `GpsFixValid()` - GPS fix status
- `LessThan(a, b)` - Safe less-than comparison

**Navigation Variables:**
- `nav_radius` - Default circle radius (user-configurable)
- `nav_climb` - Default climb rate
- `kill_throttle` - Emergency throttle kill flag
- `ground_alt` - Ground altitude (deprecated in v5.8+, use GetAltRef())

### 5. **Advanced Examples**

**Progressive Altitude Circles:**
```xml
<for var="i" from="1" to="5">
  <circle wp="HOME" radius="75" alt="ground_alt + 50*$i" until="stage_time > 60"/>
</for>
```

**Dynamic Speed Control:**
```xml
<call_once fun="gh_set_max_speed(2.0)"/>
```

**Actuator Control:**
```xml
<set var="h_ctl_disabled" value="TRUE"/>
<set var="h_ctl_aileron_setpoint" value="0"/>
<set var="h_ctl_elevator_setpoint" value="MAX_PPRZ/2"/>
```
### 6. **Condition Expressions**
Common conditions used in `until` and exception attributes:
- `NavCircleCount() > 0.5` - Complete half circle
- `NavQdrCloseTo(bearing)` - Close to bearing
- `GetPosAlt() > altitude` - Above altitude
- `stage_time > seconds` - Stage timeout
- `LessThan(NavBlockTime(), 10)` - Block time limit
- `GpsFixValid()` - GPS status check
- `PowerVoltage() < 10` - Low battery condition
- `datalink_time > 22` - Communication timeout
- `autopilot_flight_time > 840` - Flight time limit

## Implementation Priority

### Phase 1 (Essential - Implement First)
1. **GO action** - Basic waypoint navigation
2. **CIRCLE action** - Loitering capability  
3. **HOME action** - Return to home safety
4. **DEROUTE action** - Block transitions
5. **SET action** - Basic state management
6. **WHILE action** - Basic loops
7. **Standard initialization blocks** - GPS wait, geo init, holding point

### Phase 2 (Common Patterns)
1. **SURVEY_RECTANGLE action** - Automated mapping
2. **PATH action** - Multi-waypoint routes
3. **HEADING action** - Directional flight
4. **STAY action** - Position holding
5. **FOR action** - Counted loops
6. **CALL action** - Function calls
7. **Exception handling** - Safety conditions
8. **Flight plan variables** - User-configurable parameters

### Phase 3 (Advanced Patterns)
1. **EIGHT action** - Figure-8 patterns
2. **OVAL action** - Oval patterns
3. **ATTITUDE action** - Manual control
4. **Sectors** - No-fly zones
5. **Procedures and includes** - Reusable components
6. **XYZ action** - RC-controlled waypoint
7. **Advanced expressions** - Complex conditions

### Phase 4 (Specialized)
1. **FOLLOW action** - Multi-aircraft formation flight
2. **ABIDE action** - Hybrid aircraft positioning
3. **CALL_ONCE action** - Single execution functions
4. **Modules integration** - External module support
5. **Advanced navigation functions** - Custom C functions
6. **Dynamic variable control** - Runtime parameter adjustment

## Block Examples

### Simple Takeoff Block
```xml
## Block Examples

### Complete Flight Plan Structure
```xml
<!DOCTYPE flight_plan SYSTEM "flight_plan.dtd">
<flight_plan alt="250" ground_alt="185" lat0="43.46223" lon0="1.27289" 
             name="Example Mission" max_dist_from_home="300" qfu="270" 
             security_height="25">
  
  <header>
#include "subsystems/navigation/nav_line.h"
#include "subsystems/datalink/datalink.h"
  </header>

  <waypoints>
    <waypoint name="HOME" x="0" y="0"/>
    <waypoint name="STDBY" x="49.5" y="100.1"/>
    <waypoint name="SURVEY_START" x="-119.2" y="69.6"/>
    <waypoint name="SURVEY_END" x="274.4" y="209.5"/>
    <waypoint name="AF" x="177.4" y="45.1" alt="30"/>
    <waypoint name="TD" x="28.8" y="57.0" alt="0"/>
  </waypoints>

  <variables>
    <variable var="survey_speed" init="12" min="8" max="20" step="1" 
              shortname="Survey Speed" unit="m/s"/>
  </variables>

  <sectors>
    <sector name="SAFETY_ZONE" color="red">
      <corner name="SURVEY_START"/>
      <corner name="SURVEY_END"/>
      <corner name="AF"/>
      <corner name="TD"/>
    </sector>
  </sectors>

  <exceptions>
    <exception cond="datalink_time > 22" deroute="Emergency RTH"/>
    <exception cond="PowerVoltage() < 10.5" deroute="Low Battery Landing"/>
  </exceptions>

  <blocks>
    <!-- Initialization blocks... -->
    <block name="Mission Block">
      <survey_rectangle wp1="SURVEY_START" wp2="SURVEY_END" grid="50"/>
      <deroute block="Return Home"/>
    </block>
  </blocks>
</flight_plan>
```

### Standard Initialization Sequence
```xml
<block name="Wait GPS">
  <set value="1" var="kill_throttle"/>
  <while cond="!GpsFixValid()"/>
</block>

<block name="Geo init">
  <while cond="LessThan(NavBlockTime(), 10)"/>
  <call fun="NavSetGroundReferenceHere()"/>
</block>

<block name="Holding point">
  <set value="1" var="kill_throttle"/>
  <attitude roll="0" throttle="0" vmode="throttle"/>
</block>
```

### Takeoff Block
```xml
<block name="Takeoff" strip_icon="takeoff.png" strip_button="Takeoff" 
       key="t" group="home">
  <exception cond="GetPosAlt() > ground_alt+25" deroute="Standby"/>
  <set value="0" var="kill_throttle"/>
  <set value="0" var="estimator_flight_time"/>
  <go wp="CLIMB" throttle="1.0" vmode="throttle" pitch="15"/>
</block>
```

### Survey Mission Block
```xml
<block name="Automated Survey" strip_button="Start Survey" strip_icon="survey.png">
  <call_once fun="nav_survey_rectangle_init(WP_S1, WP_S2, survey_speed, 50)"/>
  <survey_rectangle wp1="SURVEY_START" wp2="SURVEY_END" grid="50" orientation="NS"/>
  <deroute block="Return Home"/>
</block>
```

### Complex Navigation Pattern
```xml
<block name="Search Pattern">
  <for var="altitude_level" from="1" to="3">
    <for var="search_leg" from="1" to="4">
      <go wp="SEARCH_$search_leg" alt="ground_alt + 50*$altitude_level" 
          hmode="route" vmode="alt"/>
      <circle wp="SEARCH_$search_leg" radius="25" 
              until="NavCircleCount() > 1"/>
    </for>
  </for>
  <deroute block="Standby"/>
</block>
```

### Emergency Landing Block
```xml
<block name="Emergency Land">
  <set value="DEFAULT_CIRCLE_RADIUS" var="nav_radius"/>
  <call fun="nav_compute_baseleg(WP_AF, WP_TD, WP_BASELEG, nav_radius)"/>
  <circle wp="BASELEG" radius="nav_radius" until="NavCircleCount() > 0.5"/>
  <circle wp="BASELEG" radius="nav_radius" 
          until="NavQdrCloseTo(DegOfRad(baseleg_out_qdr)-10) && 
                 10 > fabs(GetPosAlt() - WaypointAlt(WP_BASELEG))"/>
  <go wp="TD" from="AF" vmode="glide" hmode="route"/>
</block>
```

### Advanced Conditional Logic
```xml
<block name="Adaptive Mission">
  <while cond="PowerVoltage() > 11.0">
    <if cond="datalink_time < 5">
      <!-- Good communication - continue survey -->
      <survey_rectangle wp1="AREA1_START" wp2="AREA1_END" grid="30"/>
    </if>
    <if cond="datalink_time >= 5 && datalink_time < 15">
      <!-- Weak communication - simple pattern -->
      <circle wp="STDBY" radius="nav_radius"/>
    </if>
    <if cond="datalink_time >= 15">
      <!-- No communication - return home -->
      <deroute block="Return Home"/>
    </if>
  </while>
  <deroute block="Low Battery Landing"/>
</block>
```

This reference provides the complete specification for implementing Paparazzi's flight plan capabilities in the new GCS. The documentation is now consistent with the official Wiki and includes all the important features and examples needed for systematic implementation.
```

### Survey Mission Block
```xml
<block name="Survey Area">
  <survey_rectangle wp1="SURVEY_START" wp2="SURVEY_END" grid="50"/>
  <deroute block="Return Home"/>
</block>
```

### Emergency Landing Block
```xml
<block name="Emergency Land">
  <set var="nav_radius" value="DEFAULT_CIRCLE_RADIUS"/>
  <call fun="nav_compute_baseleg(WP_AF, WP_TD, WP_BASELEG, nav_radius)"/>
  <circle wp="BASELEG" radius="nav_radius" until="NavCircleCount() > 0.5"/>
  <go wp="TD" from="AF" vmode="glide" hmode="route"/>
</block>
```

This reference provides the complete specification for implementing Paparazzi flight plan capabilities in the new GCS. Start with Phase 1 actions and progressively add more complex features.