#!/usr/bin/env python3
"""
AI Pilot Flight Planning and Safety System
FAA-compliant autonomous UAV operations
"""

import json
from datetime import datetime
from typing import Dict, List, Any

class FAAKnowledgeBase:
    """FAA regulations and safety knowledge for UAV operations"""

    def __init__(self):
        self.faa_rules = {
            'part_107': {
                'max_altitude': 400,  # feet AGL
                'visual_line_of_sight': True,
                'over_people': False,
                'night_operations': False,
                'controlled_airspace': False,
                'min_distance_from_clouds': 500,  # feet horizontal
                'min_distance_below_clouds': 500,  # feet vertical
            },
            'safety_margins': {
                'battery_reserve': 5,  # minutes
                'altitude_buffer': 100,  # feet
                'horizontal_buffer': 500,  # feet from obstacles
                'emergency_descent_rate': 500,  # fpm
            }
        }

    def check_flight_compliance(self, flight_plan: Dict[str, Any]) -> Dict[str, Any]:
        """Check if flight plan complies with FAA regulations"""

        violations = []
        warnings = []

        # Check altitude limits
        if flight_plan.get('max_altitude', 0) > self.faa_rules['part_107']['max_altitude']:
            violations.append(f"Maximum altitude exceeds FAA limit of {self.faa_rules['part_107']['max_altitude']}ft")

        # Check battery reserve
        estimated_flight_time = flight_plan.get('estimated_flight_time', 0)
        if estimated_flight_time < self.faa_rules['safety_margins']['battery_reserve'] + 5:
            violations.append(f"Insufficient battery reserve. Need at least {self.faa_rules['safety_margins']['battery_reserve']}min reserve")

        # Check operating area
        if flight_plan.get('over_populated_area', False):
            violations.append("Cannot operate over populated areas")

        return {
            'compliant': len(violations) == 0,
            'violations': violations,
            'warnings': warnings,
            'recommendations': self.generate_safety_recommendations(flight_plan)
        }

    def generate_safety_recommendations(self, flight_plan: Dict[str, Any]) -> List[str]:
        """Generate safety recommendations based on flight plan"""

        recommendations = []

        # Weather considerations
        if flight_plan.get('wind_speed', 0) > 10:
            recommendations.append("High wind conditions detected. Consider delaying flight.")

        # Terrain considerations
        if flight_plan.get('terrain_elevation', 0) > 1000:
            recommendations.append("High terrain elevation. Ensure adequate altitude buffer.")

        # Traffic considerations
        if flight_plan.get('near_airport', False):
            recommendations.append("Near controlled airspace. Maintain extra separation from manned aircraft.")

        return recommendations

class WeatherService:
    """Weather data integration for flight planning"""

    def __init__(self):
        self.metar_url = "https://aviationweather.gov/api/data/metar"
        self.taf_url = "https://aviationweather.gov/api/data/taf"

    def get_weather(self, location: Dict[str, float], radius: int = 50) -> Dict[str, Any]:
        """Get METAR and TAF data for flight area"""

        # Note: location and radius parameters reserved for future API integration
        # For demo purposes, return simulated weather data
        # In production, this would call actual weather APIs
        return {
            'metar': {
                'station': 'KEXAMPLE',
                'temperature': 25,
                'dewpoint': 15,
                'wind_speed': 8,
                'wind_direction': 180,
                'visibility': 10,
                'altimeter': 30.12,
                'ceiling': 5000
            },
            'taf': {
                'forecast': 'VFR conditions expected',
                'wind': '5-10 knots',
                'visibility': 'greater than 6 miles'
            },
            'flight_risk': self.assess_flight_risk({
                'wind_speed': 8,
                'visibility': 10,
                'ceiling': 5000
            })
        }

    def assess_flight_risk(self, weather: Dict[str, Any]) -> str:
        """Assess flight risk based on weather conditions"""

        wind_speed = weather.get('wind_speed', 0)
        visibility = weather.get('visibility', 10)
        ceiling = weather.get('ceiling', 10000)

        if wind_speed > 20 or visibility < 3 or ceiling < 1000:
            return 'HIGH_RISK'
        elif wind_speed > 10 or visibility < 5 or ceiling < 3000:
            return 'MODERATE_RISK'
        else:
            return 'LOW_RISK'

class TerrainService:
    """Terrain and elevation data for flight planning"""

    def __init__(self):
        # In production, this would integrate with elevation APIs
        # For demo, we'll use simplified terrain modeling
        pass

    def get_terrain_profile(self, flight_path: List[Dict[str, float]]) -> Dict[str, Any]:
        """Get terrain profile along flight path"""

        # Simplified terrain analysis
        max_elevation = 500  # feet MSL
        obstacles = []

        # Check for obstacles along path
        for i, waypoint in enumerate(flight_path):
            # Simulate terrain/obstacle checking
            if i == 2:  # Simulate an obstacle at waypoint 3
                obstacles.append({
                    'location': waypoint,
                    'height': 200,  # feet AGL
                    'type': 'tree_line'
                })

        return {
            'max_terrain_elevation': max_elevation,
            'obstacles': obstacles,
            'minimum_safe_altitude': max_elevation + 200,  # 200ft buffer
            'terrain_clearance': self.check_terrain_clearance(flight_path, max_elevation)
        }

    def check_terrain_clearance(self, flight_path: List[Dict[str, float]], max_terrain: float) -> bool:
        """Check if flight path maintains adequate terrain clearance"""
        min_altitude = min(wp.get('altitude', 0) for wp in flight_path)
        return min_altitude >= (max_terrain + 200)  # 200ft minimum clearance

class AIPilot:
    """AI Pilot with FAA knowledge and safety-first decision making"""

    def __init__(self):
        self.faa_kb = FAAKnowledgeBase()
        self.weather = WeatherService()
        self.terrain = TerrainService()
        self.current_flight_plan = None

    def plan_flight(self, mission_params: Dict[str, Any]) -> Dict[str, Any]:
        """Create a comprehensive flight plan with safety analysis"""

        print("🧠 AI PILOT - FLIGHT PLANNING")
        print("=" * 50)

        # Load aircraft data
        aircraft_data = self.load_aircraft_data(mission_params.get('aircraft_config'))

        # Get environmental data
        location = mission_params.get('location', {'lat': 37.7749, 'lon': -122.4194})
        weather_data = self.weather.get_weather(location)
        terrain_data = self.terrain.get_terrain_profile(mission_params.get('waypoints', []))

        # Calculate performance
        performance = self.calculate_performance(aircraft_data, weather_data)

        # Create flight plan
        flight_plan = {
            'mission_id': f"AI_PILOT_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'aircraft': aircraft_data,
            'weather': weather_data,
            'terrain': terrain_data,
            'performance': performance,
            'waypoints': mission_params.get('waypoints', []),
            'emergency_procedures': self.generate_emergency_procedures(),
            'pilot_briefing': self.generate_pilot_briefing(aircraft_data, weather_data, terrain_data)
        }

        # FAA compliance check
        compliance = self.faa_kb.check_flight_compliance(flight_plan)
        flight_plan['faa_compliance'] = compliance

        # Final safety assessment
        flight_plan['go_no_go'] = self.make_go_no_go_decision(flight_plan)

        self.current_flight_plan = flight_plan
        return flight_plan

    def load_aircraft_data(self, config_file: str) -> Dict[str, Any]:
        """Load aircraft configuration and performance data"""

        try:
            with open(f'aircraft_builder/{config_file}', 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Flatten the nested structure for easier access
                aircraft = data.get('design', {})
                aircraft.update(data.get('flight_characteristics', {}))
                aircraft['weight_balance'] = data.get('weight_balance', {})
                return aircraft
        except (FileNotFoundError, json.JSONDecodeError):
            # Return default aircraft data
            return {
                'name': 'AI_Pilot_Flying_Wing_185g',
                'type': 'flying_wing',
                'empty_weight': 185,
                'max_takeoff_weight': 205,
                'wingspan': 800,
                'wing_area': 0.12,
                'airspeeds': {'Vs': 1.1, 'Vx': 1.2, 'Vy': 1.4, 'Vno': 1.7},
                'estimated_flight_time': 47,
                'battery_reserve': 5
            }

    def calculate_performance(self, aircraft: Dict[str, Any], weather: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate aircraft performance considering weather"""

        base_flight_time = aircraft.get('estimated_flight_time', 30)
        wind_speed = weather.get('metar', {}).get('wind_speed', 0)

        # Wind correction (simplified)
        wind_correction = wind_speed * 0.1  # 10% time reduction per 10 knots wind
        adjusted_flight_time = base_flight_time * (1 - wind_correction/100)

        return {
            'cruise_speed': aircraft['airspeeds']['Vy'],
            'max_speed': aircraft['airspeeds']['Vno'],
            'stall_speed': aircraft['airspeeds']['Vs'],
            'estimated_flight_time': max(5, adjusted_flight_time),  # Minimum 5 minutes
            'range': adjusted_flight_time * aircraft['airspeeds']['Vy'] * 0.8,  # 80% efficiency
            'wind_impact': wind_correction,
            'battery_reserve': aircraft.get('battery_reserve', 5)
        }

    def generate_emergency_procedures(self) -> Dict[str, Any]:
        """Generate emergency procedures for the aircraft"""

        return {
            'engine_failure': {
                'immediate_actions': ['Reduce throttle to idle', 'Pitch down for best glide speed'],
                'best_glide_speed': 'Vs + 5 knots',
                'landing_priority': 'Find suitable landing area immediately'
            },
            'loss_of_control': {
                'immediate_actions': ['Throttle to idle', 'Attempt recovery with full control deflection'],
                'recovery_technique': 'Opposite rudder to stop rotation, then gentle back pressure'
            },
            'low_battery': {
                'warning_threshold': '20% remaining',
                'actions': ['Return to launch immediately', 'Use minimum throttle for cruise'],
                'reserve_time': '5 minutes at minimum throttle'
            },
            'ads_b_traffic': {
                'separation_standard': '500 feet vertical, 1 nautical mile horizontal',
                'avoidance_action': 'Climb or descend to increase separation',
                'communication': 'Monitor ADS-B display continuously'
            }
        }

    def generate_pilot_briefing(self, aircraft: Dict[str, Any], weather: Dict[str, Any],
                              terrain: Dict[str, Any]) -> str:
        """Generate a professional pilot briefing"""

        briefing = f"""
AI PILOT BRIEFING - {datetime.now().strftime('%Y-%m-%d %H:%M')}

AIRCRAFT: {aircraft.get('name', 'Unknown')}
Weight: {aircraft.get('empty_weight', 0)}g
Flight Time: {aircraft.get('estimated_flight_time', 0)} minutes

WEATHER:
Wind: {weather.get('metar', {}).get('wind_speed', 0)} knots
Visibility: {weather.get('metar', {}).get('visibility', 10)} miles
Flight Risk: {weather.get('flight_risk', 'UNKNOWN')}

TERRAIN:
Max Elevation: {terrain.get('max_terrain_elevation', 0)} feet MSL
Min Safe Altitude: {terrain.get('minimum_safe_altitude', 0)} feet MSL
Obstacles: {len(terrain.get('obstacles', []))} detected

CRITICAL SPEEDS:
Stall (Vs): {aircraft.get('airspeeds', {}).get('Vs', 0):.1f} m/s
Best Climb (Vx): {aircraft.get('airspeeds', {}).get('Vx', 0):.1f} m/s
Best Cruise (Vy): {aircraft.get('airspeeds', {}).get('Vy', 0):.1f} m/s
Max Speed (Vno): {aircraft.get('airspeeds', {}).get('Vno', 0):.1f} m/s

EMERGENCY PROCEDURES:
- Engine failure: Reduce throttle, pitch for best glide
- Control loss: Throttle idle, use rudder for recovery
- Low battery: Return to launch immediately
- Traffic: Maintain 500ft vertical separation

SAFETY FIRST: Never compromise safety for mission completion.
Go-around is always an option if landing is not assured.
"""

        return briefing.strip()

    def make_go_no_go_decision(self, flight_plan: Dict[str, Any]) -> Dict[str, Any]:
        """Make final go/no-go decision based on all factors"""

        decision_factors = {
            'faa_compliant': flight_plan['faa_compliance']['compliant'],
            'weather_acceptable': flight_plan['weather'].get('flight_risk') != 'HIGH_RISK',
            'terrain_clearance': flight_plan['terrain'].get('terrain_clearance', True),
            'battery_reserve': flight_plan['performance']['estimated_flight_time'] > 10,
            'aircraft_ready': True  # Would check pre-flight checklist
        }

        go_decision = all(decision_factors.values())

        reasons = []
        if not go_decision:
            for factor, status in decision_factors.items():
                if not status:
                    reasons.append(f"Failed {factor.replace('_', ' ')} check")

        return {
            'go': go_decision,
            'confidence_level': 'HIGH' if go_decision else 'LOW',
            'reasons': reasons,
            'recommendations': flight_plan['faa_compliance'].get('recommendations', [])
        }

    def monitor_flight(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        """Monitor ongoing flight and provide pilot guidance"""

        alerts = []
        recommendations = []

        # Airspeed monitoring
        airspeed = telemetry.get('airspeed', 0)
        stall_speed = self.current_flight_plan['aircraft']['airspeeds']['Vs']

        if airspeed < stall_speed * 1.2:
            alerts.append({
                'level': 'CRITICAL',
                'message': f'Airspeed too low! Current: {airspeed:.1f} m/s, Stall: {stall_speed:.1f} m/s',
                'action': 'Increase throttle immediately, lower nose gently'
            })

        # Altitude monitoring
        altitude = telemetry.get('altitude', 0)
        min_safe_alt = self.current_flight_plan['terrain']['minimum_safe_altitude']

        if altitude < min_safe_alt:
            alerts.append({
                'level': 'WARNING',
                'message': f'Low altitude! Current: {altitude}ft, Minimum: {min_safe_alt}ft',
                'action': 'Climb to safe altitude'
            })

        # Battery monitoring
        battery_level = telemetry.get('battery_percent', 100)
        if battery_level < 20:
            alerts.append({
                'level': 'WARNING',
                'message': f'Low battery: {battery_level}%',
                'action': 'Return to launch area immediately'
            })

        return {
            'alerts': alerts,
            'recommendations': recommendations,
            'flight_status': 'NOMINAL' if not alerts else 'CAUTION'
        }

def main():
    """Demo AI Pilot flight planning"""

    ai_pilot = AIPilot()

    # Sample mission parameters
    mission = {
        'aircraft_config': 'AI_Pilot_Flying_Wing_185g.json',
        'location': {'lat': 37.7749, 'lon': -122.4194},
        'waypoints': [
            {'lat': 37.7749, 'lon': -122.4194, 'altitude': 200},
            {'lat': 37.7859, 'lon': -122.4094, 'altitude': 250},
            {'lat': 37.7749, 'lon': -122.4194, 'altitude': 200}
        ],
        'mission_type': 'reconnaissance',
        'max_altitude': 300
    }

    # Plan the flight
    flight_plan = ai_pilot.plan_flight(mission)

    # Display results
    print("\n" + "="*60)
    print("AI PILOT FLIGHT PLAN SUMMARY")
    print("="*60)

    print(f"Mission ID: {flight_plan['mission_id']}")
    print(f"Aircraft: {flight_plan['aircraft']['name']}")
    print(f"Estimated Flight Time: {flight_plan['performance']['estimated_flight_time']:.1f} minutes")

    print(f"\nFAA COMPLIANCE: {'✅ PASS' if flight_plan['faa_compliance']['compliant'] else '❌ FAIL'}")
    if flight_plan['faa_compliance']['violations']:
        for violation in flight_plan['faa_compliance']['violations']:
            print(f"  • {violation}")

    print(f"\nGO/NO-GO DECISION: {'🟢 GO' if flight_plan['go_no_go']['go'] else '🔴 NO-GO'}")
    print(f"Confidence: {flight_plan['go_no_go']['confidence_level']}")

    if flight_plan['go_no_go']['reasons']:
        print("Reasons:")
        for reason in flight_plan['go_no_go']['reasons']:
            print(f"  • {reason}")

    print("\nPILOT BRIEFING:")
    print("-" * 40)
    print(flight_plan['pilot_briefing'])

    # Save flight plan
    with open(f'prompts/flight_plan_{flight_plan["mission_id"]}.json', 'w', encoding='utf-8') as f:
        json.dump(flight_plan, f, indent=2, default=str)

    print(f"\n💾 Flight plan saved to: prompts/flight_plan_{flight_plan['mission_id']}.json")

if __name__ == "__main__":
    main()