import { api } from './api';
import { storage } from './storage';

export const syncManager = {
  /**
   * Main sync function: pushes local edits to server, and pulls down fresh data
   */
  async syncWithServer(): Promise<{ success: boolean; processedCount: number; error?: string }> {
    try {
      // 1. Read queue
      const queue = await storage.getSyncQueue();
      let processedCount = 0;

      if (queue.length > 0) {
        // Push local operations to NestJS sync controller
        const result = await api.syncOperations(queue);
        if (result && result.success) {
          processedCount = result.processedCount || queue.length;
          // Clear sync queue on successful processing
          await storage.clearSyncQueue();
        } else {
          return { success: false, processedCount: 0, error: 'Failed to push sync queue' };
        }
      }

      // 2. Pull down fresh projects and boreholes to update local cache
      const myProjectMemberships = await api.getMyProjects();
      if (Array.isArray(myProjectMemberships)) {
        // Flatten the nested project object from the project member relationship
        const projects = myProjectMemberships
          .filter((m: any) => m.project != null)
          .map((m: any) => ({
            ...m.project,
            assigned: true,
          }));

        await storage.saveProjects(projects);
        
        // Update boreholes for each active project
        for (const project of projects) {
          try {
            const boreholes = await api.getProjectBoreholes(project.id);
            if (Array.isArray(boreholes)) {
              await storage.saveBoreholes(project.id, boreholes);
              
              // Cache intervals for each borehole in this project
              for (const bh of boreholes) {
                try {
                  const intervals = await api.getBoreholeIntervals(bh.id);
                  if (Array.isArray(intervals)) {
                    await storage.saveIntervals(bh.id, intervals);
                  }
                } catch (bhErr) {
                  console.warn(`Could not sync intervals for BH ${bh.id}:`, bhErr);
                }
              }
            }
          } catch (projErr) {
            console.warn(`Could not sync boreholes for project ${project.id}:`, projErr);
          }
        }
      }

      return { success: true, processedCount };
    } catch (error: any) {
      console.error('Sync failed:', error);
      return {
        success: false,
        processedCount: 0,
        error: error.message || 'Network error during synchronization',
      };
    }
  },

  /**
   * Appends an operation to the sync queue for future sync
   */
  async queueOperation(
    entityType: 'BORING' | 'SPT_RECORD' | 'SAMPLE' | 'PHOTO' | 'WATER_LEVEL',
    entityId: string,
    operationType: 'CREATE' | 'UPDATE' | 'DELETE',
    payload: any,
    boringSessionId?: string
  ): Promise<void> {
    const user = await storage.getUser();
    const deviceId = user?.id || 'unknown-device'; // fallback or retrieve device uuid
    const operationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await storage.addToSyncQueue({
      deviceId,
      operationId,
      entityType,
      entityId,
      operationType,
      payloadJson: payload,
      boringSessionId,
    });
  }
};
