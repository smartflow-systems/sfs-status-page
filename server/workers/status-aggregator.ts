import { storage } from "../storage";
import { log } from "../vite";

// ============================================================================
// STATUS HISTORY AGGREGATOR
// ============================================================================

export class StatusAggregatorWorker {
  private isRunning = false;
  private aggregateInterval: NodeJS.Timeout | null = null;

  async start() {
    if (this.isRunning) {
      log("Status aggregator worker is already running");
      return;
    }

    this.isRunning = true;
    log("Starting status aggregator worker...");

    // Run aggregation every hour
    this.aggregateInterval = setInterval(() => {
      this.aggregateDailyStatus();
    }, 3600000); // 1 hour

    // Run initial aggregation
    await this.aggregateDailyStatus();
  }

  stop() {
    if (this.aggregateInterval) {
      clearInterval(this.aggregateInterval);
      this.aggregateInterval = null;
    }
    this.isRunning = false;
    log("Status aggregator worker stopped");
  }

  async aggregateDailyStatus() {
    try {
      log("Aggregating daily status data...");

      // Get all services from all workspaces
      // For now, we'll aggregate yesterday's data
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // This is a simplified version - in production you'd want to
      // iterate through all services in all workspaces
      // For now, this serves as a template

      log("Daily status aggregation complete");
    } catch (error) {
      console.error("Error aggregating daily status:", error);
    }
  }

  async aggregateServiceStatus(serviceId: string, date: Date) {
    await storage.aggregateDailyStatus(serviceId, date);
  }
}

// Singleton instance
export const statusAggregatorWorker = new StatusAggregatorWorker();
