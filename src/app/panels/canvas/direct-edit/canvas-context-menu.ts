import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { CommandBus } from '../../../core/commands/command-bus';
import { createComponent } from '../../../core/commands/tree-commands';
import { ComponentKind, KIND_LABEL } from '../../../core/state/component-tree.types';
import { CanvasContextMenuService, CONTEXT_ADD_KINDS } from './canvas-context-menu.service';

@Component({
  selector: 'app-canvas-context-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (ctx.menu(); as m) {
      <div
        class="backdrop"
        (click)="close()"
        (contextmenu)="close(); $event.preventDefault()"
      ></div>
      <div
        class="menu"
        role="menu"
        [style.left.px]="m.x"
        [style.top.px]="m.y"
        (click)="$event.stopPropagation()"
      >
        <div class="menu-title">Agregar hijo aquí</div>
        @for (k of kinds; track k) {
          <button type="button" role="menuitem" (click)="add(k, m.parentId)">
            {{ label(k) }}
          </button>
        }
      </div>
    }
  `,
  styles: [`
    .backdrop { position:fixed; inset:0; z-index:90; }
    .menu {
      position:fixed; z-index:100; min-width:11rem;
      background:var(--surface-2); border:1px solid var(--border); border-radius:8px;
      padding:.35rem; box-shadow:0 8px 24px rgba(0,0,0,.35);
    }
    .menu-title { font-size:.68rem; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; padding:.2rem .45rem .35rem; }
    button { display:block; width:100%; text-align:left; background:transparent; border:0; color:var(--fg); border-radius:6px; padding:.35rem .5rem; font-size:.78rem; cursor:pointer; }
    button:hover { background:var(--surface-1); }
  `],
})
export class CanvasContextMenuComponent {
  protected readonly ctx = inject(CanvasContextMenuService);
  private readonly bus = inject(CommandBus);
  protected readonly kinds = CONTEXT_ADD_KINDS;

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.close();
  }

  protected label(k: ComponentKind): string {
    return KIND_LABEL[k];
  }

  protected add(kind: ComponentKind, parentId: string): void {
    this.bus.dispatch(createComponent(parentId, kind), 'user', {
      rationale: 'Creación desde menú contextual del canvas.',
    });
    this.close();
  }

  protected close(): void {
    this.ctx.close();
  }
}
