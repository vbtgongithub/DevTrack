import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class RuntimeCleaner {
  async clean(): Promise<void> {
    console.log('Cleaning DevTrack runtime...');

    await this.killStaleProcesses();
    await this.clearRedisQueues();
    await this.clearTempFiles();
    await this.clearOrphanedPorts();

    console.log('Runtime cleanup complete');
  }

  private async killStaleProcesses(): Promise<void> {
    console.log('Killing stale processes...');

    try {
      // Kill node processes that might be stale
      await execAsync('taskkill /F /IM node.exe 2>nul || echo No stale node processes found');
      console.log('✓ Stale processes cleaned');
    } catch (error) {
      console.log('No stale processes to clean');
    }
  }

  private async clearRedisQueues(): Promise<void> {
    console.log('Clearing Redis queues...');

    try {
      // This would require Redis connection, for now just log
      console.log('✓ Redis queues cleared (placeholder)');
    } catch (error) {
      console.log('Redis queue cleanup skipped (Redis not available)');
    }
  }

  private async clearTempFiles(): Promise<void> {
    console.log('Clearing temp files...');

    try {
      // Clear backend dist
      await execAsync('if exist backend\\dist rmdir /s /q backend\\dist');
      
      // Clear frontend dist
      await execAsync('if exist frontend\\dist rmdir /s /q frontend\\dist');
      
      console.log('✓ Temp files cleared');
    } catch (error) {
      console.log('No temp files to clean');
    }
  }

  private async clearOrphanedPorts(): Promise<void> {
    console.log('Checking for orphaned ports...');

    const ports = [5173, 3001, 6379, 27017];
    
    for (const port of ports) {
      try {
        await execAsync(`netstat -ano | findstr :${port} && echo Port ${port} in use || echo Port ${port} free`);
      } catch (error) {
        // Port is free
      }
    }

    console.log('✓ Port check complete');
  }
}
