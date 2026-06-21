import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  Renderer2,
} from '@angular/core';
import { CommandBus } from '../../../core/commands/command-bus';
import { updateNode } from '../../../core/commands/tree-commands';
import { ComponentTreeStore } from '../../../core/state/component-tree.store';
import { CanvasEditStore } from './canvas-edit.store';
import {
  buildDirectEditPatch,
  DirectEditField,
  readDirectEditValue,
} from './direct-edit-field';

/**
 * Doble clic → contenteditable in-place.
 * Enter confirma, Escape cancela, blur confirma si hubo cambios.
 */
@Directive({
  selector: '[appDirectEdit]',
  standalone: true,
})
export class DirectEditDirective implements OnDestroy {
  readonly nodeId = input.required<string>({ alias: 'appDirectEdit' });
  readonly field = input<DirectEditField>('text');

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly tree = inject(ComponentTreeStore);
  private readonly bus = inject(CommandBus);
  private readonly editStore = inject(CanvasEditStore);

  private original = '';
  private active = false;

  @HostListener('dblclick', ['$event'])
  protected onDoubleClick(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    const node = this.tree.node(this.nodeId());
    if (!node) return;

    this.original = readDirectEditValue(node, this.field());
    this.active = true;
    this.editStore.start(this.nodeId());

    const host = this.el.nativeElement;
    this.renderer.setAttribute(host, 'contenteditable', 'true');
    this.renderer.addClass(host, 'direct-editing');
    host.textContent = this.original;
    host.focus();

    const range = document.createRange();
    range.selectNodeContents(host);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }

  @HostListener('keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (!this.active) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.el.nativeElement.blur();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.el.nativeElement.textContent = this.original;
      this.exit(false);
    }
  }

  @HostListener('blur')
  protected onBlur(): void {
    if (!this.active) return;
    const next = (this.el.nativeElement.textContent ?? '').trim();
    const changed = next !== this.original.trim();
    this.exit(changed);
  }

  private exit(commit: boolean): void {
    if (!this.active) return;
    const host = this.el.nativeElement;
    const node = this.tree.node(this.nodeId());
    if (commit && node) {
      const next = (host.textContent ?? '').trim();
      const patch = buildDirectEditPatch(node, this.field(), next);
      this.bus.dispatch(
        updateNode(node.id, patch.label ?? node.label, patch.props ?? node.props),
        'user',
        { rationale: 'Edición in-place en el canvas.' },
      );
    }
    this.renderer.removeAttribute(host, 'contenteditable');
    this.renderer.removeClass(host, 'direct-editing');
    this.active = false;
    this.editStore.stop();
  }

  ngOnDestroy(): void {
    if (this.active) this.exit(false);
  }
}
