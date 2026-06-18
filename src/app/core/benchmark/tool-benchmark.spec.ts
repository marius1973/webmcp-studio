import { describe, it, expect } from 'vitest';
import { performance } from 'node:perf_hooks';
import { ComponentTreeStore } from '../state/component-tree.store';
import { createComponent } from '../commands/tree-commands';
import { CommandBus } from '../commands/command-bus';
import { ObserverStore } from '../state/observer.store';
import { TelemetryStore } from '../state/telemetry.store';
import { Injector, runInInjectionContext } from '@angular/core';

const N = 50;

/** Simula N clics DOM + lectura de atributos (enfoque frágil sin WebMCP). */
function simulateDomAutomation(clicks: number): number {
  const dom: { tag: string; x: number; y: number; text: string }[] = [
    { tag: 'div', x: 0, y: 0, text: 'AppRoot' },
  ];
  const t0 = performance.now();
  for (let i = 0; i < clicks; i++) {
    const target = dom[i % dom.length]!;
    const x = target.x + 12;
    const y = target.y + 8;
    void x;
    void y;
    dom.push({
      tag: i % 3 === 0 ? 'button' : 'span',
      x,
      y,
      text: `node-${i}`,
    });
    if (dom.length > 200) dom.shift();
  }
  return performance.now() - t0;
}

/** N mutaciones vía CommandBus (enfoque WebMCP Studio). */
function webmcpMutations(n: number): number {
  const tree = new ComponentTreeStore();
  const observer = new ObserverStore();
  const telemetry = { enabled: () => false, record: () => {} };
  const injector = Injector.create({
    providers: [
      { provide: ComponentTreeStore, useValue: tree },
      { provide: ObserverStore, useValue: observer },
      { provide: TelemetryStore, useValue: telemetry },
    ],
  });
  const bus = runInInjectionContext(injector, () => new CommandBus());
  const t0 = performance.now();
  for (let i = 0; i < n; i++) {
    bus.dispatch(createComponent('root', i % 2 === 0 ? 'button' : 'text'), 'agent', { skipObserver: true });
  }
  return performance.now() - t0;
}

describe('benchmark (honesto, local)', () => {
  it(`WebMCP: ${N} create_component vs DOM simulado`, () => {
    const domMs = simulateDomAutomation(N);
    const webmcpMs = webmcpMutations(N);
    const ratio = domMs / Math.max(webmcpMs, 0.01);

    console.log('\n--- WebMCP Studio benchmark ---');
    console.log(`Operaciones: ${N}`);
    console.log(`DOM simulado (clics + nodos): ${domMs.toFixed(2)} ms`);
    console.log(`WebMCP Commands (estructurado): ${webmcpMs.toFixed(2)} ms`);
    console.log(`Ratio DOM/WebMCP: ${ratio.toFixed(2)}x (mayor = DOM más lento en este modelo)`);
    console.log('Nota: el DOM simulado no incluye OCR ni latencia de agente LLM.\n');

    expect(treeNodeCountAfter(N)).toBeGreaterThan(1);
    expect(webmcpMs).toBeLessThan(5000);
  });
});

function treeNodeCountAfter(n: number): number {
  const tree = new ComponentTreeStore();
  for (let i = 0; i < n; i++) tree.createChild('root', 'button');
  return tree.nodeCount();
}
