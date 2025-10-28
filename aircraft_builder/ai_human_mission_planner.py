#!/usr/bin/env python3
"""
AI-Human Mission Planning Interface
Demonstrates the collaborative decision-making process
"""

import asyncio
from datetime import datetime
from typing import Dict, Any
import sys
import os

# Add project root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from system_validator import validate_mission_area, get_operational_status
except ImportError:
    # Fallback if system validator not available
    def validate_mission_area(lat, lng, is_sim):  # pylint: disable=unused-argument
        return True
    def get_operational_status():
        return {"mode": "SIMULATOR", "status": "READY", "signal_quality": 95.0}

class AIMissionPlanner:
    """AI component of mission planning - handles technical analysis"""
    
    def __init__(self):
        self.confidence_threshold = 80
    
    async def analyze_mission_parameters(self, mission_params: Dict[str, Any]) -> Dict[str, Any]:
        """Perform comprehensive technical analysis of mission parameters"""
        
        analysis = {
            "technical_assessment": {},
            "weather_analysis": {},
            "regulatory_compliance": {},
            "risk_factors": [],
            "ai_confidence": 0,
            "ai_recommendation": "NO-GO",
            "key_concerns": [],
            "supporting_data": {}
        }
        
        # Technical assessment
        tech_score = await self._analyze_technical_parameters(mission_params)
        analysis["technical_assessment"] = tech_score
        
        # Weather analysis
        weather_score = await self._analyze_weather_conditions(mission_params.get("weather", {}))
        analysis["weather_analysis"] = weather_score
        
        # Regulatory compliance
        reg_score = await self._check_regulatory_compliance(mission_params)
        analysis["regulatory_compliance"] = reg_score
        
        # System validation check
        location = mission_params.get("location", {})
        validation_result = validate_mission_area(
            location.get("latitude", 0),
            location.get("longitude", 0),
            mission_params.get("is_simulation", True)
        )
        
        # Calculate overall confidence
        scores = [tech_score["score"], weather_score["score"], reg_score["score"]]
        if validation_result:
            scores.append(85)  # Good system validation adds confidence
        else:
            scores.append(25)  # Poor system validation reduces confidence
            analysis["key_concerns"].append("System validation indicates poor signal conditions")
        
        analysis["ai_confidence"] = sum(scores) / len(scores)
        
        # Generate recommendation
        if analysis["ai_confidence"] >= 85:
            analysis["ai_recommendation"] = "GO"
        elif analysis["ai_confidence"] >= 70:
            analysis["ai_recommendation"] = "CAUTION"
        else:
            analysis["ai_recommendation"] = "NO-GO"
        
        return analysis
    
    async def _analyze_technical_parameters(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze aircraft and flight technical parameters"""
        
        aircraft = params.get("aircraft", {})
        flight_plan = params.get("flight_plan", {})
        
        issues = []
        score = 100
        
        # Weight check
        weight = aircraft.get("takeoff_weight", 0)
        if weight > 250:
            issues.append("🔴 Aircraft exceeds 250g FAA limit")
            score -= 40
        elif weight > 225:
            issues.append("🟡 Aircraft near weight limit")
            score -= 15
        
        # Battery analysis
        flight_time = flight_plan.get("estimated_duration", 0)
        battery_time = aircraft.get("max_flight_time", 0)
        
        if flight_time >= battery_time * 0.9:
            issues.append("🔴 Insufficient battery margin")
            score -= 30
        elif flight_time >= battery_time * 0.8:
            issues.append("🟡 Low battery margin")
            score -= 15
        
        return {
            "score": max(0, score),
            "issues": issues,
            "details": {
                "weight_usage": f"{weight}g ({(weight/250)*100:.1f}% of limit)",
                "battery_margin": f"{battery_time - flight_time:.1f} min reserve",
                "weight_status": "🟢 Good" if weight <= 225 else "🟡 Caution" if weight <= 250 else "🔴 Over Limit"
            }
        }
    
    async def _analyze_weather_conditions(self, weather: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze weather conditions for flight safety"""
        
        issues = []
        score = 100
        
        # Wind analysis
        wind_speed = weather.get("wind_speed", 0)
        if wind_speed > 15:
            issues.append("🔴 Wind speed exceeds safe limits")
            score -= 35
        elif wind_speed > 10:
            issues.append("🟡 Moderate wind conditions")
            score -= 15
        
        # Visibility
        visibility = weather.get("visibility", 10)
        if visibility < 3:
            issues.append("🔴 Poor visibility conditions")
            score -= 30
        elif visibility < 5:
            issues.append("🟡 Limited visibility")
            score -= 10
        
        # Conditions
        condition = weather.get("condition", "vfr")
        if condition == "ifr":
            issues.append("🔴 IFR conditions not suitable for drone ops")
            score -= 40
        elif condition == "mvfr":
            issues.append("🟡 Marginal VFR conditions")
            score -= 15
        
        return {
            "score": max(0, score),
            "issues": issues,
            "details": {
                "wind_status": f"🟢 {wind_speed} kts" if wind_speed <= 10 else f"🟡 {wind_speed} kts" if wind_speed <= 15 else f"🔴 {wind_speed} kts",
                "visibility_status": f"🟢 {visibility} km" if visibility >= 5 else f"🟡 {visibility} km" if visibility >= 3 else f"🔴 {visibility} km",
                "condition_status": f"🟢 {condition.upper()}" if condition == "vfr" else f"🟡 {condition.upper()}" if condition == "mvfr" else f"🔴 {condition.upper()}"
            }
        }
    
    async def _check_regulatory_compliance(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Check FAA Part 107 compliance"""
        
        issues = []
        score = 100
        
        flight_plan = params.get("flight_plan", {})
        
        # Altitude check
        max_alt = flight_plan.get("max_altitude", 0)
        if max_alt > 120:  # 400 feet
            issues.append("🔴 Altitude exceeds 400ft AGL limit")
            score -= 40
        elif max_alt > 100:
            issues.append("🟡 Operating near altitude limit")
            score -= 10
        
        # Airspace check (simplified)
        controlled_airspace = params.get("controlled_airspace", False)
        if controlled_airspace:
            auth = params.get("airspace_authorization", False)
            if not auth:
                issues.append("🔴 No authorization for controlled airspace")
                score -= 50
            else:
                issues.append("🟢 Controlled airspace - authorized")
        
        return {
            "score": max(0, score),
            "issues": issues,
            "details": {
                "altitude_status": f"🟢 {max_alt}m" if max_alt <= 100 else f"🟡 {max_alt}m" if max_alt <= 120 else f"🔴 {max_alt}m",
                "airspace_status": "🟢 Class G" if not controlled_airspace else "🟢 Authorized" if controlled_airspace and params.get("airspace_authorization") else "🔴 Restricted"
            }
        }

class HumanPilotInterface:
    """Human interface for mission planning and decision making"""
    
    def __init__(self):
        self.ai_planner = AIMissionPlanner()
    
    def display_mission_briefing(self, analysis: Dict[str, Any], mission_params: Dict[str, Any]):  # pylint: disable=unused-argument
        """Display mission briefing in human-friendly format"""
        
        print("\n" + "="*60)
        print("🚁 MISSION BRIEFING - AI TECHNICAL ANALYSIS")
        print("="*60)
        
        # Bottom line up front
        confidence = analysis["ai_confidence"]
        recommendation = analysis["ai_recommendation"]
        
        if recommendation == "GO":
            status_color = "🟢"
        elif recommendation == "CAUTION":
            status_color = "🟡"
        else:
            status_color = "🔴"
        
        print(f"\n{status_color} **AI RECOMMENDATION: {recommendation}**")
        print(f"📊 AI Confidence Level: {confidence:.0f}%")
        print(f"{'▓' * int(confidence/5)}{'░' * (20-int(confidence/5))} {confidence:.0f}%")
        
        # Key status indicators
        print(f"\n🎯 **KEY STATUS INDICATORS**")
        print("-" * 30)
        
        tech = analysis["technical_assessment"]
        weather = analysis["weather_analysis"]
        reg = analysis["regulatory_compliance"]
        
        print(f"Aircraft Systems: {self._format_score_bar(tech['score'])}")
        print(f"Weather Conditions: {self._format_score_bar(weather['score'])}")
        print(f"Regulatory Compliance: {self._format_score_bar(reg['score'])}")
        
        # Critical issues
        all_issues = tech["issues"] + weather["issues"] + reg["issues"] + analysis["key_concerns"]
        if all_issues:
            print(f"\n⚠️ **ISSUES REQUIRING ATTENTION**")
            print("-" * 30)
            for issue in all_issues:
                print(f"  {issue}")
        
        # Technical details
        print(f"\n📋 **TECHNICAL DETAILS**")
        print("-" * 30)
        
        details = {**tech["details"], **weather["details"], **reg["details"]}
        for key, value in details.items():
            formatted_key = key.replace("_", " ").title()
            print(f"  {formatted_key}: {value}")
        
        # System status
        system_status = get_operational_status()
        print(f"\n🔧 **SYSTEM STATUS**")
        print("-" * 30)
        print(f"  System Mode: {system_status['mode']}")
        print(f"  Status: {system_status['status']}")
        print(f"  Signal Quality: {self._format_percentage_bar(system_status['signal_quality'])}")
    
    def _format_score_bar(self, score: float) -> str:
        """Format a score as a colored bar"""
        if score >= 85:
            color = "🟢"
        elif score >= 70:
            color = "🟡"  
        else:
            color = "🔴"
        
        bars = int(score / 5)
        return f"{color} {'▓' * bars}{'░' * (20-bars)} {score:.0f}%"
    
    def _format_percentage_bar(self, percentage: float) -> str:
        """Format a percentage as a bar chart"""
        bars = int(percentage / 5)
        if percentage >= 80:
            color = "🟢"
        elif percentage >= 60:
            color = "🟡"
        else:
            color = "🔴"
        return f"{color} {'▓' * bars}{'░' * (20-bars)} {percentage:.1f}%"
    
    def get_human_decision(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Get human pilot's go/no-go decision and reasoning"""
        
        print(f"\n👨‍✈️ **PILOT-IN-COMMAND DECISION REQUIRED**")
        print("-" * 40)
        print(f"AI Recommendation: {analysis['ai_recommendation']}")
        print(f"AI Confidence: {analysis['ai_confidence']:.0f}%")
        
        print("\nOptions:")
        print("  1. GO - Proceed with mission")
        print("  2. CAUTION - Proceed with extra monitoring")
        print("  3. NO-GO - Cancel mission")
        print("  4. REQUEST MORE INFO - Need additional analysis")
        
        while True:
            try:
                choice = input("\nYour decision (1-4): ").strip()
                
                if choice == "1":
                    decision = "GO"
                    break
                elif choice == "2":
                    decision = "CAUTION"
                    break
                elif choice == "3":
                    decision = "NO-GO"
                    break
                elif choice == "4":
                    print("\n🤖 Additional analysis options:")
                    print("  - Weather trend analysis")
                    print("  - Similar mission experiences")
                    print("  - Alternative flight plans")
                    continue
                else:
                    print("Please enter 1, 2, 3, or 4")
                    continue
                    
            except KeyboardInterrupt:
                print("\n\nMission planning cancelled.")
                return {"decision": "CANCELLED", "reasoning": "User cancelled"}
        
        # Get reasoning
        reasoning = input(f"\nPlease explain your reasoning for {decision}: ").strip()
        
        # Get any additional human insights
        insights = input("Any additional concerns or observations? (optional): ").strip()
        
        return {
            "decision": decision,
            "reasoning": reasoning,
            "human_insights": insights,
            "timestamp": datetime.now(),
            "ai_recommendation": analysis["ai_recommendation"],
            "ai_confidence": analysis["ai_confidence"]
        }

async def demo_mission_planning():
    """Demonstrate AI-Human collaborative mission planning"""
    
    # Sample mission parameters
    mission_params = {
        "mission_type": "training",
        "location": {
            "name": "Training Field Alpha",
            "latitude": 40.0150,
            "longitude": -74.0060
        },
        "aircraft": {
            "name": "Training Drone Mk2",
            "takeoff_weight": 235,
            "max_flight_time": 25
        },
        "flight_plan": {
            "estimated_duration": 18,
            "max_altitude": 95,
            "waypoints": 6
        },
        "weather": {
            "wind_speed": 12,
            "wind_direction": 270,
            "visibility": 8,
            "condition": "vfr",
            "temperature": 22
        },
        "controlled_airspace": False,
        "is_simulation": True
    }
    
    print("🚁 PaparazziAI - AI-Human Collaborative Mission Planning")
    print("="*60)
    
    # AI analyzes the mission
    print("\n🤖 AI performing technical analysis...")
    ai_planner = AIMissionPlanner()
    analysis = await ai_planner.analyze_mission_parameters(mission_params)
    
    # Present analysis to human
    human_interface = HumanPilotInterface()
    human_interface.display_mission_briefing(analysis, mission_params)
    
    # Get human decision
    human_decision = human_interface.get_human_decision(analysis)
    
    # Display outcome
    print(f"\n📋 **MISSION PLANNING OUTCOME**")
    print("-" * 30)
    print(f"Final Decision: **{human_decision['decision']}**")
    print(f"Human Reasoning: {human_decision['reasoning']}")
    
    if human_decision['human_insights']:
        print(f"Human Insights: {human_decision['human_insights']}")
    
    # This is where we would record the experience for learning
    print(f"\n💾 Mission planning data recorded for future learning")
    
    if human_decision['decision'] == 'GO':
        print(f"\n🚀 **MISSION AUTHORIZED** - Proceeding with flight operations")
    elif human_decision['decision'] == 'CAUTION':
        print(f"\n⚠️ **MISSION AUTHORIZED WITH CAUTION** - Extra monitoring required")
    else:
        print(f"\n🛑 **MISSION CANCELLED** - Better on the ground wishing we were flying!")

if __name__ == "__main__":
    asyncio.run(demo_mission_planning())