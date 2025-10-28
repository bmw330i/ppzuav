/**
 * Mission Experience Repository
 * Stores and retrieves flight experience data for continuous learning
 */

import fs from 'fs/promises';
import path from 'path';
import { createLogger } from './file-logger.js';

const logger = createLogger('EXPERIENCE');

interface WeatherConditions {
  windSpeed: number;
  windDirection: number;
  visibility: number;
  cloudCeiling?: number;
  temperature: number;
  barometricPressure: number;
  condition: 'vfr' | 'mvfr' | 'ifr';
}

interface FlightParameters {
  takeoffWeight: number;
  estimatedFlightTime: number;
  maxAltitude: number;
  plannedSpeed: number;
  batteryCapacity: number;
  route: Array<{ lat: number; lng: number; alt: number }>;
}

interface MissionOutcome {
  success: boolean;
  actualFlightTime: number;
  batteryUsed: number;
  weatherEncountered: WeatherConditions;
  incidents: Array<{
    type: 'weather' | 'technical' | 'navigation' | 'safety';
    severity: 'low' | 'medium' | 'high';
    description: string;
    timestamp: Date;
    humanDecision?: string;
    aiResponse?: string;
  }>;
  humanInterventions: Array<{
    trigger: string;
    humanInput: string;
    aiAnalysis: string;
    outcome: 'positive' | 'negative' | 'neutral';
    timestamp: Date;
  }>;
  lessonsLearned: string[];
}

interface MissionExperience {
  id: string;
  timestamp: Date;
  missionType: 'training' | 'research' | 'search_rescue' | 'monitoring' | 'simulation';
  location: { lat: number; lng: number; name: string };
  plannedParameters: FlightParameters;
  plannedWeather: WeatherConditions;
  outcome: MissionOutcome;
  humanPilotNotes: string;
  aiAnalysis: string;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
}

interface ExperienceQuery {
  location?: { lat: number; lng: number; radius: number };
  weatherConditions?: Partial<WeatherConditions>;
  missionType?: string;
  riskLevel?: string;
  timeRange?: { start: Date; end: Date };
  similarTo?: Partial<FlightParameters>;
}

interface LearningInsight {
  pattern: string;
  confidence: number;
  applicableConditions: string[];
  recommendation: string;
  sourceExperiences: string[];
}

class MissionExperienceRepository {
  private experienceDir: string;
  private indexFile: string;
  private experiences: Map<string, MissionExperience> = new Map();

  constructor(dataDir: string = './data/experience') {
    this.experienceDir = dataDir;
    this.indexFile = path.join(dataDir, 'index.json');
    this.initializeRepository();
  }

  private async initializeRepository(): Promise<void> {
    try {
      await fs.mkdir(this.experienceDir, { recursive: true });
      await this.loadExistingExperiences();
    } catch (error) {
      logger.error('Failed to initialize experience repository', { error });
    }
  }

  private async loadExistingExperiences(): Promise<void> {
    try {
      const indexData = await fs.readFile(this.indexFile, 'utf-8');
      const index = JSON.parse(indexData);
      
      for (const experienceId of index.experiences || []) {
        const experience = await this.loadExperience(experienceId);
        if (experience) {
          this.experiences.set(experienceId, experience);
        }
      }
      
      logger.info(`Loaded ${this.experiences.size} mission experiences`);
    } catch (error) {
      // No existing index, start fresh
      logger.info('Starting with empty experience repository');
    }
  }

  private async loadExperience(id: string): Promise<MissionExperience | null> {
    try {
      const filePath = path.join(this.experienceDir, `${id}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data, (key, value) => {
        // Convert date strings back to Date objects
        if (key.includes('timestamp') || key.includes('Date')) {
          return new Date(value);
        }
        return value;
      });
    } catch (error) {
      logger.warn(`Failed to load experience ${id}`, { error });
      return null;
    }
  }

  async recordExperience(experience: MissionExperience): Promise<void> {
    try {
      // Store the experience
      this.experiences.set(experience.id, experience);
      
      // Save to file
      const filePath = path.join(this.experienceDir, `${experience.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(experience, null, 2));
      
      // Update index
      await this.updateIndex();
      
      logger.info(`Recorded mission experience: ${experience.id}`, {
        type: experience.missionType,
        success: experience.outcome.success,
        location: experience.location.name
      });
      
    } catch (error) {
      logger.error('Failed to record experience', { experienceId: experience.id, error });
    }
  }

  private async updateIndex(): Promise<void> {
    const index = {
      lastUpdated: new Date(),
      totalExperiences: this.experiences.size,
      experiences: Array.from(this.experiences.keys())
    };
    
    await fs.writeFile(this.indexFile, JSON.stringify(index, null, 2));
  }

  async queryExperiences(query: ExperienceQuery): Promise<MissionExperience[]> {
    const results: MissionExperience[] = [];
    
    for (const experience of this.experiences.values()) {
      if (this.matchesQuery(experience, query)) {
        results.push(experience);
      }
    }
    
    // Sort by relevance and recency
    return results.sort((a, b) => {
      // Prioritize more recent experiences
      const timeDiff = b.timestamp.getTime() - a.timestamp.getTime();
      
      // But also consider confidence level
      const confidenceDiff = (b.confidence - a.confidence) * 1000;
      
      return confidenceDiff + (timeDiff / 1000000); // Scale time difference
    });
  }

  private matchesQuery(experience: MissionExperience, query: ExperienceQuery): boolean {
    // Location proximity check
    if (query.location) {
      const distance = this.calculateDistance(
        experience.location,
        query.location
      );
      if (distance > query.location.radius) return false;
    }
    
    // Weather conditions similarity
    if (query.weatherConditions) {
      if (!this.isWeatherSimilar(experience.plannedWeather, query.weatherConditions)) {
        return false;
      }
    }
    
    // Mission type match
    if (query.missionType && experience.missionType !== query.missionType) {
      return false;
    }
    
    // Risk level match
    if (query.riskLevel && experience.riskLevel !== query.riskLevel) {
      return false;
    }
    
    // Time range check
    if (query.timeRange) {
      if (experience.timestamp < query.timeRange.start || 
          experience.timestamp > query.timeRange.end) {
        return false;
      }
    }
    
    return true;
  }

  private calculateDistance(point1: { lat: number; lng: number }, 
                          point2: { lat: number; lng: number }): number {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private isWeatherSimilar(weather1: WeatherConditions, 
                          weather2: Partial<WeatherConditions>): boolean {
    const tolerance = {
      windSpeed: 5, // knots
      windDirection: 30, // degrees
      visibility: 2, // km
      temperature: 10, // celsius
      barometricPressure: 5 // mb
    };
    
    for (const [key, value] of Object.entries(weather2)) {
      if (value !== undefined && weather1[key as keyof WeatherConditions] !== undefined) {
        const diff = Math.abs(Number(weather1[key as keyof WeatherConditions]) - Number(value));
        const maxDiff = tolerance[key as keyof typeof tolerance] || 0;
        
        if (diff > maxDiff) return false;
      }
    }
    
    return true;
  }

  async generateLearningInsights(): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];
    
    // Analyze patterns in successful vs failed missions
    await this.analyzeSuccessPatterns(insights);
    
    // Analyze weather-related incidents
    await this.analyzeWeatherPatterns(insights);
    
    // Analyze human intervention patterns
    await this.analyzeHumanInterventions(insights);
    
    return insights.filter(insight => insight.confidence > 0.7);
  }

  private async analyzeSuccessPatterns(insights: LearningInsight[]): Promise<void> {
    const successful = Array.from(this.experiences.values()).filter(e => e.outcome.success);
    const failed = Array.from(this.experiences.values()).filter(e => !e.outcome.success);
    
    if (successful.length < 3 || failed.length < 1) return;
    
    // Pattern: Wind speed threshold
    const successfulWindSpeeds = successful.map(e => e.plannedWeather.windSpeed);
    const failedWindSpeeds = failed.map(e => e.plannedWeather.windSpeed);
    
    const avgSuccessWind = successfulWindSpeeds.reduce((a, b) => a + b, 0) / successfulWindSpeeds.length;
    const avgFailedWind = failedWindSpeeds.reduce((a, b) => a + b, 0) / failedWindSpeeds.length;
    
    if (avgFailedWind > avgSuccessWind + 3) {
      insights.push({
        pattern: `Missions tend to fail when wind speed exceeds ${Math.ceil(avgSuccessWind + 2)} knots`,
        confidence: 0.85,
        applicableConditions: ['high_wind'],
        recommendation: `Consider postponing missions when wind speed > ${Math.ceil(avgSuccessWind + 2)} knots`,
        sourceExperiences: [...successful.slice(0, 3).map(e => e.id), ...failed.slice(0, 2).map(e => e.id)]
      });
    }
  }

  private async analyzeWeatherPatterns(insights: LearningInsight[]): Promise<void> {
    const weatherIncidents = Array.from(this.experiences.values())
      .flatMap(e => e.outcome.incidents.filter(i => i.type === 'weather'));
    
    if (weatherIncidents.length < 3) return;
    
    const highSeverity = weatherIncidents.filter(i => i.severity === 'high');
    
    if (highSeverity.length > 0) {
      insights.push({
        pattern: 'Weather-related high severity incidents correlate with poor visibility conditions',
        confidence: 0.8,
        applicableConditions: ['low_visibility', 'weather_degradation'],
        recommendation: 'Implement stricter visibility thresholds and real-time weather monitoring',
        sourceExperiences: Array.from(this.experiences.values())
          .filter(e => e.outcome.incidents.some(i => i.type === 'weather' && i.severity === 'high'))
          .map(e => e.id)
      });
    }
  }

  private async analyzeHumanInterventions(insights: LearningInsight[]): Promise<void> {
    const interventions = Array.from(this.experiences.values())
      .flatMap(e => e.outcome.humanInterventions);
    
    if (interventions.length < 5) return;
    
    const positiveInterventions = interventions.filter(i => i.outcome === 'positive');
    
    if (positiveInterventions.length > interventions.length * 0.7) {
      insights.push({
        pattern: 'Human interventions have high success rate in improving mission outcomes',
        confidence: 0.9,
        applicableConditions: ['uncertainty', 'complex_decisions'],
        recommendation: 'Proactively seek human input when AI confidence < 80% or in novel situations',
        sourceExperiences: Array.from(this.experiences.values())
          .filter(e => e.outcome.humanInterventions.length > 0)
          .map(e => e.id)
      });
    }
  }

  async getExperienceSummary(): Promise<{
    totalMissions: number;
    successRate: number;
    averageConfidence: number;
    topLessonsLearned: string[];
    recentTrends: string[];
  }> {
    const experiences = Array.from(this.experiences.values());
    
    const successRate = experiences.filter(e => e.outcome.success).length / experiences.length;
    const avgConfidence = experiences.reduce((sum, e) => sum + e.confidence, 0) / experiences.length;
    
    // Aggregate lessons learned
    const allLessons = experiences.flatMap(e => e.outcome.lessonsLearned);
    const lessonCounts = new Map<string, number>();
    
    allLessons.forEach(lesson => {
      lessonCounts.set(lesson, (lessonCounts.get(lesson) || 0) + 1);
    });
    
    const topLessons = Array.from(lessonCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([lesson]) => lesson);
    
    return {
      totalMissions: experiences.length,
      successRate: Math.round(successRate * 100) / 100,
      averageConfidence: Math.round(avgConfidence),
      topLessonsLearned: topLessons,
      recentTrends: this.analyzeRecentTrends(experiences)
    };
  }

  private analyzeRecentTrends(experiences: MissionExperience[]): string[] {
    const recent = experiences
      .filter(e => e.timestamp > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    if (recent.length < 3) return ['Insufficient recent data for trend analysis'];
    
    const trends: string[] = [];
    
    // Success rate trend
    const recentSuccess = recent.slice(0, 5).filter(e => e.outcome.success).length / 5;
    const olderSuccess = recent.slice(5, 10).filter(e => e.outcome.success).length / Math.min(5, recent.length - 5);
    
    if (recentSuccess > olderSuccess + 0.1) {
      trends.push('Improving success rate in recent missions');
    } else if (recentSuccess < olderSuccess - 0.1) {
      trends.push('Declining success rate - review recent changes');
    }
    
    // Human intervention trend
    const recentInterventions = recent.slice(0, 5).reduce((sum, e) => sum + e.outcome.humanInterventions.length, 0) / 5;
    if (recentInterventions > 2) {
      trends.push('Increased human interventions - AI may need additional training');
    }
    
    return trends.length > 0 ? trends : ['Stable performance patterns'];
  }
}

export default MissionExperienceRepository;
export type { 
  MissionExperience, 
  MissionOutcome, 
  FlightParameters, 
  WeatherConditions, 
  ExperienceQuery, 
  LearningInsight 
};