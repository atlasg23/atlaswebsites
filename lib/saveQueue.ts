import { saveTemplateCustomization } from './templateCustomizations';

interface QueueItem {
  id: string;
  slug: string;
  field: 'custom_images' | 'custom_text' | 'custom_colors' | 'custom_styles' | 'custom_buttons';
  key: string;
  value: string;
  timestamp: number;
}

class SaveQueue {
  private queue: QueueItem[] = [];
  private isProcessing = false;
  private onStatusChange?: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
  private saveTimeout?: NodeJS.Timeout;
  private retryCount = 0;
  private maxRetries = 3;

  constructor(onStatusChange?: (status: 'idle' | 'saving' | 'saved' | 'error') => void) {
    this.onStatusChange = onStatusChange;
  }

  add(slug: string, field: QueueItem['field'], key: string, value: string) {
    const id = `${field}_${key}_${Date.now()}`;

    // Remove any existing items for the same field/key
    this.queue = this.queue.filter(item =>
      !(item.field === field && item.key === key)
    );

    this.queue.push({
      id,
      slug,
      field,
      key,
      value,
      timestamp: Date.now()
    });

    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Set new timeout for batch save
    this.saveTimeout = setTimeout(() => {
      this.process();
    }, 500); // Wait 500ms before processing
  }

  private async process() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    this.onStatusChange?.('saving');

    const itemsToSave = [...this.queue];
    this.queue = [];

    try {
      // Save all items in parallel
      const promises = itemsToSave.map(item =>
        saveTemplateCustomization(item.slug, item.field, item.key, item.value)
      );

      const results = await Promise.all(promises);

      // Check if all saves were successful
      if (results.every(result => result)) {
        this.onStatusChange?.('saved');
        this.retryCount = 0;

        // Show saved status for 2 seconds
        setTimeout(() => {
          if (this.queue.length === 0) {
            this.onStatusChange?.('idle');
          }
        }, 2000);
      } else {
        throw new Error('Some saves failed');
      }
    } catch (error) {
      console.error('Save error:', error);

      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.queue.push(...itemsToSave);
        setTimeout(() => this.process(), 1000 * this.retryCount);
      } else {
        this.onStatusChange?.('error');
        this.retryCount = 0;
      }
    } finally {
      this.isProcessing = false;

      // Process any new items that were added while we were saving
      if (this.queue.length > 0) {
        setTimeout(() => this.process(), 100);
      }
    }
  }

  getQueueLength() {
    return this.queue.length;
  }

  clearQueue() {
    this.queue = [];
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }
}

export default SaveQueue;