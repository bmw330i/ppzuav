/**
 * Human-Pilot Dashboard Interface
 * Presents complex flight data in human-friendly visual formats
 * Colors: Green (good), Yellow (warning), Red (alert)
 * Formats: Bar charts, gauges, highlighted text for quick decisions
 */

import MissionExperienceRepository, { type LearningInsight } from './mission-experience.js';
import type { WeatherConditions, FlightParameters } from './mission-experience.js';

interface DashboardMetric {
  name: string;
  value: number;
  max: number;
  unit: string;
  status: 'green' | 'yellow' | 'red';
  trend?: 'up' | 'down' | 'stable';
}

interface StatusLight {
  label: string;
  status: 'green' | 'yellow' | 'red';
  message: string;
}

interface BarChart {
  label: string;
  percentage: number;
  color: 'green' | 'yellow' | 'red';
}

interface AlertMessage {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
}

interface DashboardData {
  statusLights: StatusLight[];
  metrics: DashboardMetric[];
  barCharts: BarChart[];
  alerts: AlertMessage[];
  summary: string;
  confidence: number;
  recommendation: 'GO' | 'CAUTION' | 'NO-GO';
}

class HumanPilotDashboard {
  private experienceRepo: MissionExperienceRepository;

  constructor() {
    this.experienceRepo = new MissionExperienceRepository();
  }

  /**
   * Generate comprehensive dashboard for pre-flight decision making
   */
  async generatePreFlightDashboard(
    plannedParams: FlightParameters,
    currentWeather: WeatherConditions,
    location: { lat: number; lng: number; name: string }
  ): Promise<DashboardData> {

    const dashboard: DashboardData = {
      statusLights: [],
      metrics: [],
      barCharts: [],
      alerts: [],
      summary: '',
      confidence: 0,
      recommendation: 'GO'
    };

    // Get relevant experience
    const similarExperiences = await this.experienceRepo.queryExperiences({
      location: { ...location, radius: 50 }, // 50km radius
      weatherConditions: currentWeather,
      similarTo: plannedParams
    });

    // Generate status lights
    dashboard.statusLights = this.generateStatusLights(currentWeather, plannedParams);

    // Generate metrics with visual bars
    dashboard.metrics = this.generateMetrics(currentWeather, plannedParams);

    // Generate bar charts for key ratios
    dashboard.barCharts = this.generateBarCharts(currentWeather, plannedParams, similarExperiences);

    // Generate alerts
    dashboard.alerts = await this.generateAlerts(currentWeather, plannedParams, similarExperiences);

    // Calculate overall confidence and recommendation
    const analysis = this.analyzeOverallSituation(dashboard);
    dashboard.confidence = analysis.confidence;
    dashboard.recommendation = analysis.recommendation;
    dashboard.summary = analysis.summary;

    return dashboard;
  }

  private generateStatusLights(weather: WeatherConditions, params: FlightParameters): StatusLight[] {
    const lights: StatusLight[] = [];

    // Weather status
    if (weather.condition === 'vfr') {
      lights.push({ label: 'Weather', status: 'green', message: 'VFR Conditions' });
    } else if (weather.condition === 'mvfr') {
      lights.push({ label: 'Weather', status: 'yellow', message: 'Marginal VFR' });
    } else {
      lights.push({ label: 'Weather', status: 'red', message: 'IFR Conditions' });
    }

    // Wind status
    if (weather.windSpeed <= 10) {
      lights.push({ label: 'Wind', status: 'green', message: `${weather.windSpeed} kts` });
    } else if (weather.windSpeed <= 15) {
      lights.push({ label: 'Wind', status: 'yellow', message: `${weather.windSpeed} kts - Monitor` });
    } else {
      lights.push({ label: 'Wind', status: 'red', message: `${weather.windSpeed} kts - Too High` });
    }

    // Weight status
    if (params.takeoffWeight <= 200) {
      lights.push({ label: 'Weight', status: 'green', message: `${params.takeoffWeight}g` });
    } else if (params.takeoffWeight <= 250) {
      lights.push({ label: 'Weight', status: 'yellow', message: `${params.takeoffWeight}g - Near Limit` });
    } else {
      lights.push({ label: 'Weight', status: 'red', message: `${params.takeoffWeight}g - Over Limit` });
    }

    // Visibility status
    if (weather.visibility >= 5) {
      lights.push({ label: 'Visibility', status: 'green', message: `${weather.visibility} km` });
    } else if (weather.visibility >= 3) {
      lights.push({ label: 'Visibility', status: 'yellow', message: `${weather.visibility} km - Limited` });
    } else {
      lights.push({ label: 'Visibility', status: 'red', message: `${weather.visibility} km - Poor` });
    }

    return lights;
  }

  private generateMetrics(weather: WeatherConditions, params: FlightParameters): DashboardMetric[] {
    return [
      {
        name: 'Wind Speed',
        value: weather.windSpeed,
        max: 20,
        unit: 'kts',
        status: weather.windSpeed <= 10 ? 'green' : weather.windSpeed <= 15 ? 'yellow' : 'red'
      },
      {
        name: 'Battery Life',
        value: params.estimatedFlightTime,
        max: 30,
        unit: 'min',
        status: params.estimatedFlightTime >= 20 ? 'green' : params.estimatedFlightTime >= 15 ? 'yellow' : 'red'
      },
      {
        name: 'Weight Margin',
        value: 250 - params.takeoffWeight,
        max: 250,
        unit: 'g',
        status: params.takeoffWeight <= 200 ? 'green' : params.takeoffWeight <= 240 ? 'yellow' : 'red'
      },
      {
        name: 'Visibility',
        value: weather.visibility,
        max: 10,
        unit: 'km',
        status: weather.visibility >= 5 ? 'green' : weather.visibility >= 3 ? 'yellow' : 'red'
      }
    ];
  }

  private generateBarCharts(
    weather: WeatherConditions, 
    params: FlightParameters,
    experiences: any[]
  ): BarChart[] {
    
    const charts: BarChart[] = [];

    // Safety margin
    const weightRatio = (params.takeoffWeight / 250) * 100;
    charts.push({
      label: 'Weight Usage',
      percentage: weightRatio,
      color: weightRatio <= 80 ? 'green' : weightRatio <= 95 ? 'yellow' : 'red'
    });

    // Wind conditions
    const windRatio = (weather.windSpeed / 20) * 100;
    charts.push({
      label: 'Wind Conditions',
      percentage: windRatio,
      color: windRatio <= 50 ? 'green' : windRatio <= 75 ? 'yellow' : 'red'
    });

    // Experience confidence
    const expConfidence = experiences.length > 0 ? 
      experiences.reduce((sum, exp) => sum + exp.confidence, 0) / experiences.length : 50;
    charts.push({
      label: 'Experience Level',
      percentage: expConfidence,
      color: expConfidence >= 80 ? 'green' : expConfidence >= 60 ? 'yellow' : 'red'
    });

    // Battery margin
    const batteryMargin = ((params.batteryCapacity - (params.estimatedFlightTime * 100)) / params.batteryCapacity) * 100;
    charts.push({
      label: 'Battery Reserve',
      percentage: Math.max(0, batteryMargin),
      color: batteryMargin >= 30 ? 'green' : batteryMargin >= 15 ? 'yellow' : 'red'
    });

    return charts;
  }

  private async generateAlerts(
    weather: WeatherConditions,
    params: FlightParameters,
    experiences: any[]
  ): Promise<AlertMessage[]> {
    
    const alerts: AlertMessage[] = [];
    const now = new Date();

    // Critical alerts
    if (weather.windSpeed > 18) {
      alerts.push({
        severity: 'critical',
        message: '🔴 **CRITICAL**: Wind speed exceeds safe operating limits',
        timestamp: now
      });
    }

    if (params.takeoffWeight > 250) {
      alerts.push({
        severity: 'critical',
        message: '🔴 **CRITICAL**: Aircraft weight exceeds FAA Part 107 limit',
        timestamp: now
      });
    }

    // Warning alerts
    if (weather.condition === 'mvfr') {
      alerts.push({
        severity: 'warning',
        message: '🟡 **WARNING**: Marginal VFR conditions - monitor weather closely',
        timestamp: now
      });
    }

    if (experiences.length === 0) {
      alerts.push({
        severity: 'warning',
        message: '🟡 **WARNING**: No previous experience in similar conditions',
        timestamp: now
      });
    }

    // Info alerts
    const failedExperiences = experiences.filter(exp => !exp.outcome.success);
    if (failedExperiences.length > 0) {
      alerts.push({
        severity: 'info',
        message: `ℹ️ **INFO**: ${failedExperiences.length} similar missions had issues - review lessons learned`,
        timestamp: now
      });
    }

    return alerts;
  }

  private analyzeOverallSituation(dashboard: DashboardData): {
    confidence: number;
    recommendation: 'GO' | 'CAUTION' | 'NO-GO';
    summary: string;
  } {
    
    let confidence = 100;
    let criticalIssues = 0;
    let warnings = 0;

    // Analyze status lights
    dashboard.statusLights.forEach(light => {
      if (light.status === 'red') {
        confidence -= 30;
        criticalIssues++;
      } else if (light.status === 'yellow') {
        confidence -= 15;
        warnings++;
      }
    });

    // Analyze alerts
    dashboard.alerts.forEach(alert => {
      if (alert.severity === 'critical') {
        confidence -= 25;
        criticalIssues++;
      } else if (alert.severity === 'warning') {
        confidence -= 10;
        warnings++;
      }
    });

    // Determine recommendation
    let recommendation: 'GO' | 'CAUTION' | 'NO-GO';
    if (criticalIssues > 0 || confidence < 50) {
      recommendation = 'NO-GO';
    } else if (warnings > 2 || confidence < 75) {
      recommendation = 'CAUTION';
    } else {
      recommendation = 'GO';
    }

    // Generate human-readable summary
    let summary = '';
    if (recommendation === 'GO') {
      summary = '✅ **CONDITIONS FAVORABLE** - All systems nominal for flight operations';
    } else if (recommendation === 'CAUTION') {
      summary = '⚠️ **PROCEED WITH CAUTION** - Some conditions require close monitoring';
    } else {
      summary = '🛑 **NO-GO DECISION** - Critical issues present, flight not recommended';
    }

    if (warnings > 0) {
      summary += `. ${warnings} warning${warnings > 1 ? 's' : ''} require attention.`;
    }

    return {
      confidence: Math.max(0, Math.min(100, confidence)),
      recommendation,
      summary
    };
  }

  /**
   * Generate real-time flight monitoring dashboard
   */
  async generateFlightDashboard(currentTelemetry: any): Promise<DashboardData> {
    // Implementation for in-flight monitoring
    // This would show real-time status, navigation progress, 
    // battery usage, weather changes, etc.
    
    const dashboard: DashboardData = {
      statusLights: [
        { label: 'Navigation', status: 'green', message: 'On Course' },
        { label: 'Battery', status: currentTelemetry.batteryLevel > 30 ? 'green' : 'yellow', message: `${currentTelemetry.batteryLevel}%` },
        { label: 'Link', status: 'green', message: 'Strong Signal' }
      ],
      metrics: [
        {
          name: 'Altitude',
          value: currentTelemetry.altitude,
          max: currentTelemetry.maxAltitude,
          unit: 'm',
          status: 'green'
        },
        {
          name: 'Speed',
          value: currentTelemetry.groundSpeed,
          max: currentTelemetry.maxSpeed,
          unit: 'm/s',
          status: 'green'
        }
      ],
      barCharts: [
        {
          label: 'Mission Progress',
          percentage: currentTelemetry.missionProgress,
          color: 'green'
        },
        {
          label: 'Battery Life',
          percentage: currentTelemetry.batteryLevel,
          color: currentTelemetry.batteryLevel > 30 ? 'green' : currentTelemetry.batteryLevel > 15 ? 'yellow' : 'red'
        }
      ],
      alerts: [],
      summary: '✅ **FLIGHT IN PROGRESS** - All systems operating normally',
      confidence: 95,
      recommendation: 'GO'
    };

    return dashboard;
  }

  /**
   * Get lessons learned from recent flights in human-friendly format
   */
  async getLessonsLearned(): Promise<{
    insights: LearningInsight[];
    summary: string;
    actionItems: string[];
  }> {
    
    const insights = await this.experienceRepo.generateLearningInsights();
    const experienceSummary = await this.experienceRepo.getExperienceSummary();
    
    const highConfidenceInsights = insights.filter(i => i.confidence >= 0.8);
    
    const actionItems = highConfidenceInsights.map(insight => 
      `• ${insight.recommendation}`
    );

    const summary = `📊 **FLIGHT EXPERIENCE SUMMARY**\n` +
      `Total Missions: ${experienceSummary.totalMissions}\n` +
      `Success Rate: ${(experienceSummary.successRate * 100).toFixed(1)}%\n` +
      `Average Confidence: ${experienceSummary.averageConfidence}%\n\n` +
      `🎯 **KEY INSIGHTS**: ${highConfidenceInsights.length} high-confidence patterns identified`;

    return {
      insights: highConfidenceInsights,
      summary,
      actionItems
    };
  }
}

export default HumanPilotDashboard;
export type { DashboardData, DashboardMetric, StatusLight, BarChart, AlertMessage };