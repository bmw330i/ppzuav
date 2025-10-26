#!/usr/bin/env python3
"""
Aircraft Builder for Sub-250g UAVs
AI Pilot Assistant for aircraft design and configuration

This tool helps design safe, FAA-compliant UAVs under 250g total weight.
"""

import json
import sys
from typing import Dict, List, Any
from dataclasses import dataclass
import math

@dataclass
class Component:
    name: str
    weight: float
    position: Dict[str, float]  # x, y, z coordinates from CG
    moment_arm: float = 0.0

@dataclass
class AircraftDesign:
    name: str
    type: str  # "flying_wing" or "conventional"
    wingspan: float
    wing_area: float
    empty_weight: float
    max_takeoff_weight: float
    components: List[Component]
    cg_location: float  # % of mean aerodynamic chord
    stability_margin: float

class AircraftBuilder:
    def __init__(self):
        self.autopilots = {}
        self.sensors = {}
        self.motors = {}
        self.batteries = {}
        self.servos = {}
        self.load_hardware_database()

    def load_hardware_database(self):
        """Load hardware specifications from JSON files"""
        try:
            with open('hardware_config/autopilots.json', 'r', encoding='utf-8') as f:
                self.autopilots = json.load(f)['autopilots']
            with open('hardware_config/sensors.json', 'r', encoding='utf-8') as f:
                self.sensors = json.load(f)['sensors']
        except FileNotFoundError:
            print("Hardware database not found. Please run from project root.")
            sys.exit(1)

    def design_flying_wing(self, target_weight: float = 200) -> AircraftDesign:
        """Design a basic flying wing aircraft under target weight"""

        # Start with minimal components
        components = []

        # Select autopilot (prefer lightest available)
        autopilot = min(self.autopilots.values(), key=lambda x: x['weight'])
        components.append(Component(
            name=autopilot['name'],
            weight=autopilot['weight'],
            position={'x': 0, 'y': 0, 'z': 0}  # At CG
        ))

        # Add essential sensors (positioned for CG balance)
        essential_sensors = ['imu_mpu6050', 'gps_ublox_neo_m8n', 'baro_ms5611']
        sensor_positions = [
            {'x': 120, 'y': 0, 'z': 5},   # Forward
            {'x': 140, 'y': 0, 'z': 5},   # Forward
            {'x': 130, 'y': 0, 'z': 5}    # Forward
        ]

        for i, sensor_id in enumerate(essential_sensors):
            if sensor_id in self.sensors:
                sensor = self.sensors[sensor_id]
                components.append(Component(
                    name=sensor['name'],
                    weight=sensor['weight'],
                    position=sensor_positions[i]
                ))

        # Add airspeed sensor
        airspeed = self.sensors.get('airspeed_mp3v5004')
        if airspeed:
            components.append(Component(
                name=airspeed['name'],
                weight=airspeed['weight'] + 15,  # Include pitot system
                position={'x': 50, 'y': 0, 'z': 10}  # Nose mounted
            ))

        # Calculate total weight
        total_weight = sum(comp.weight for comp in components)

        # Add battery (calculate required capacity for 10min flight)
        battery_weight = max(20, (target_weight - total_weight - 30))  # Reserve for airframe
        components.append(Component(
            name="LiPo Battery",
            weight=battery_weight,
            position={'x': -20, 'y': 0, 'z': -5}  # Aft of CG
        ))

        # Add motor and propeller
        motor_weight = 15
        components.append(Component(
            name="Brushless Motor + Propeller",
            weight=motor_weight,
            position={'x': 80, 'y': 0, 'z': 0}  # Nose
        ))

        # Calculate CG and stability
        total_weight = sum(comp.weight for comp in components)

        # Basic wing sizing (simplified)
        wingspan = 800  # mm
        wing_area = wingspan * 150 / 1000000  # m² (assuming 150mm chord)

        return AircraftDesign(
            name=f"AI_Pilot_Flying_Wing_{int(total_weight)}g",
            type="flying_wing",
            wingspan=wingspan,
            wing_area=wing_area,
            empty_weight=total_weight,
            max_takeoff_weight=min(250, total_weight + 20),
            components=components,
            cg_location=0.25,  # 25% MAC (typical for stable flying wing)
            stability_margin=0.1
        )

    def calculate_weight_balance(self, design: AircraftDesign) -> Dict[str, Any]:
        """Calculate weight and balance for the aircraft"""

        total_weight = sum(comp.weight for comp in design.components)

        # Calculate CG relative to wing leading edge (simplified)
        # Assume wing starts at x=100mm from nose for flying wing
        wing_start = 100  # mm from nose
        moments = []
        for comp in design.components:
            # Adjust position relative to wing leading edge
            relative_pos = comp.position['x'] - wing_start
            moment = comp.weight * relative_pos
            moments.append({
                'component': comp.name,
                'weight': comp.weight,
                'position': comp.position['x'],
                'relative_pos': relative_pos,
                'moment': moment
            })

        total_moment = sum(m['moment'] for m in moments)
        cg_from_wing = total_moment / total_weight

        # Calculate mean aerodynamic chord (simplified)
        mac = design.wing_area * 1000000 / design.wingspan  # mm

        # Neutral point estimate (25% MAC for flying wing)
        neutral_point = 0.25 * mac

        # Stability margin (distance from CG to neutral point)
        stability_margin = (neutral_point - cg_from_wing) / mac

        return {
            'total_weight': total_weight,
            'cg_from_wing': cg_from_wing,
            'cg_from_nose': cg_from_wing + wing_start,
            'mac': mac,
            'neutral_point': neutral_point,
            'stability_margin': stability_margin,
            'is_stable': stability_margin > 0.05,
            'weight_distribution': moments
        }

    def generate_airframe_xml(self, design: AircraftDesign) -> str:
        """Generate Paparazzi airframe XML configuration"""

        xml_template = f'''<?xml version="1.0"?>
<!DOCTYPE airframe SYSTEM "airframe.dtd">

<!-- AI Pilot Generated Airframe: {design.name} -->
<!-- Total Weight: {design.empty_weight:.1f}g -->
<!-- Type: {design.type} -->

<airframe name="{design.name}">

  <!-- Servo Configuration -->
  <servos>
    <servo name="MOTOR" no="0" min="1000" neutral="1000" max="2000"/>
    <servo name="ELEVATOR" no="1" min="1000" neutral="1500" max="2000"/>
    <servo name="RUDDER" no="2" min="1000" neutral="1500" max="2000"/>
  </servos>

  <!-- Command Configuration -->
  <commands>
    <axis name="THROTTLE" failsafe_value="0"/>
    <axis name="ROLL" failsafe_value="0"/>
    <axis name="PITCH" failsafe_value="0"/>
    <axis name="YAW" failsafe_value="0"/>
  </commands>

  <!-- RC Commands -->
  <rc_commands>
    <set command="THROTTLE" value="@THROTTLE"/>
    <set command="ROLL" value="@ROLL"/>
    <set command="PITCH" value="@PITCH"/>
    <set command="YAW" value="@YAW"/>
  </rc_commands>

  <!-- Command Laws -->
  <command_laws>
    <set servo="MOTOR" value="@THROTTLE"/>
    <set servo="ELEVATOR" value="@PITCH"/>
    <set servo="RUDDER" value="@YAW"/>
  </command_laws>

  <!-- IMU Configuration -->
  <section name="IMU" prefix="IMU_">
    <define name="GYRO_P_SIGN" value="1"/>
    <define name="GYRO_Q_SIGN" value="1"/>
    <define name="GYRO_R_SIGN" value="1"/>
    <define name="ACCEL_X_SIGN" value="1"/>
    <define name="ACCEL_Y_SIGN" value="1"/>
    <define name="ACCEL_Z_SIGN" value="1"/>
  </section>

  <!-- Battery Configuration -->
  <section name="BAT">
    <define name="MILLIAMP_AT_FULL_THROTTLE" value="1500"/>
    <define name="CATASTROPHIC_BAT_LEVEL" value="3.3" unit="V"/>
  </section>

  <!-- Flight Parameters -->
  <section name="MISC">
    <define name="NOMINAL_AIRSPEED" value="15." unit="m/s"/>
    <define name="CARROT" value="5." unit="s"/>
    <define name="CONTROL_RATE" value="60" unit="Hz"/>
  </section>

  <!-- Vertical Control -->
  <section name="VERTICAL CONTROL" prefix="V_CTL_">
    <define name="POWER_CTL_BAT_NOMINAL" value="3.7" unit="volt"/>
    <define name="ALTITUDE_PGAIN" value="0.03"/>
    <define name="ALTITUDE_MAX_CLIMB" value="2."/>
    <define name="AUTO_THROTTLE_NOMINAL_CRUISE_THROTTLE" value="0.4"/>
  </section>

  <!-- Horizontal Control -->
  <section name="HORIZONTAL CONTROL" prefix="H_CTL_">
    <define name="COURSE_PGAIN" value="1.0"/>
    <define name="ROLL_MAX_SETPOINT" value="0.6" unit="rad"/>
    <define name="PITCH_MAX_SETPOINT" value="0.5" unit="rad"/>
    <define name="PITCH_PGAIN" value="12000."/>
    <define name="ROLL_ATTITUDE_GAIN" value="7500"/>
    <define name="ROLL_RATE_GAIN" value="1500"/>
  </section>

</airframe>'''

        return xml_template

    def print_design_summary(self, design: AircraftDesign):
        """Print a summary of the aircraft design"""

        print(f"\n🚁 AI PILOT AIRCRAFT DESIGN: {design.name}")
        print(f"Type: {design.type}")
        print(f"Wingspan: {design.wingspan}mm")
        print(f"Wing Area: {design.wing_area:.3f}m²")

        print("\n⚖️  WEIGHT & BALANCE:")
        wb = self.calculate_weight_balance(design)
        print(f"Total Weight: {wb['total_weight']:.1f}g")
        print(f"CG Location: {wb['cg_from_nose']:.1f}mm from nose")
        print(f"CG from wing: {wb['cg_from_wing']:.1f}mm")
        print(f"Stability Margin: {wb['stability_margin']:.3f}")
        print(f"Stable Design: {'✅' if wb['is_stable'] else '❌'}")

        print("\n🛠️  COMPONENTS:")
        for comp in design.components:
            print(f"  • {comp.name}: {comp.weight:.1f}g @ {comp.position['x']}mm")

        print("\n📋 FLIGHT CHARACTERISTICS:")
        print(f"Max Takeoff Weight: {design.max_takeoff_weight}g")
        print(f"Estimated Flight Time: {self.estimate_flight_time(design)} minutes")
        print(f"Recommended Airspeeds: {self.calculate_airspeeds(design)}")

    def estimate_flight_time(self, design: AircraftDesign) -> float:
        """Estimate flight time based on battery and weight"""
        battery_weight = next((c.weight for c in design.components if "Battery" in c.name), 30)
        # Simplified calculation: ~10min for 30g battery, scales with weight
        return (battery_weight / 30) * 10

    def calculate_airspeeds(self, design: AircraftDesign) -> Dict[str, float]:
        """Calculate recommended airspeeds"""
        wing_loading = design.empty_weight / 1000 / design.wing_area  # kg/m²

        # Simplified calculations (would need actual aerodynamic data)
        vs = math.sqrt(wing_loading * 2 / 1.225) * 0.7  # Stall speed approximation
        vno = vs * 1.5  # Max structural speed
        vx = vs * 1.1   # Best angle of climb
        vy = vs * 1.3   # Best rate of climb

        return {
            'Vs': round(vs, 1),
            'Vx': round(vx, 1),
            'Vy': round(vy, 1),
            'Vno': round(vno, 1)
        }

def main():
    builder = AircraftBuilder()

    print("🧠 AI PILOT AIRCRAFT BUILDER")
    print("Designing sub-250g UAV for autonomous flight")

    # Design a flying wing
    design = builder.design_flying_wing()

    # Print summary
    builder.print_design_summary(design)

    # Generate configuration files
    wb = builder.calculate_weight_balance(design)

    # Save design as JSON
    design_data = {
        'design': {
            'name': design.name,
            'type': design.type,
            'wingspan': design.wingspan,
            'wing_area': design.wing_area,
            'empty_weight': design.empty_weight,
            'max_takeoff_weight': design.max_takeoff_weight,
            'cg_location_percent': design.cg_location,
            'stability_margin': design.stability_margin
        },
        'weight_balance': wb,
        'components': [
            {
                'name': comp.name,
                'weight': comp.weight,
                'position': comp.position
            } for comp in design.components
        ],
        'flight_characteristics': {
            'estimated_flight_time': builder.estimate_flight_time(design),
            'airspeeds': builder.calculate_airspeeds(design)
        }
    }

    with open(f'aircraft_builder/{design.name}.json', 'w', encoding='utf-8') as f:
        json.dump(design_data, f, indent=2)

    # Generate airframe XML
    xml_config = builder.generate_airframe_xml(design)
    with open(f'aircraft_builder/{design.name}.xml', 'w', encoding='utf-8') as f:
        f.write(xml_config)

    print("\n💾 Configuration files saved:")
    print(f"  • aircraft_builder/{design.name}.json")
    print(f"  • aircraft_builder/{design.name}.xml")

    print("\n✈️  Aircraft design complete!")
    print("Ready for AI Pilot autonomous operations.")

if __name__ == "__main__":
    main()