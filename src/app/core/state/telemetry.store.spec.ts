import { describe, it, expect } from 'vitest';
import { TelemetryStore } from './telemetry.store';

describe('TelemetryStore', () => {
  it('no registra si está desactivado', () => {
    const t = new TelemetryStore();
    t.record('tool_invoke', 'read_tree');
    expect(t.count()).toBe(0);
  });

  it('registra cuando está activo', () => {
    const t = new TelemetryStore();
    t.toggle();
    t.record('export', 'json');
    expect(t.count()).toBe(1);
    expect(t.summary()['export:json']).toBe(1);
  });
});
