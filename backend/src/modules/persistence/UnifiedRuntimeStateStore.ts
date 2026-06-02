export class UnifiedRuntimeStateStore {
  private states = new Map<string, any>();

  async saveState(id: string, state: any): Promise<void> {
    this.states.set(id, JSON.parse(JSON.stringify(state))); // Deep copy
  }

  async getState(id: string): Promise<any> {
    const state = this.states.get(id);
    return state ? JSON.parse(JSON.stringify(state)) : null;
  }
}
