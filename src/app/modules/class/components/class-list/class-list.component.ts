// class-list.component.ts
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassesDto } from '../../models/class.model';
import { ClassDetailComponent } from '../class-detail/class-detail.component'; 

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [CommonModule, ClassDetailComponent], // ✅ add ClassDetailComponent
  templateUrl: './class-list.component.html',
  styleUrls: ['./class-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassListComponent implements OnChanges {
  @Input() classes: ClassesDto[] = [];
  @Input() isLoading = false;
  @Input() selectedIds: Set<string> = new Set();

  @Output() editClass       = new EventEmitter<ClassesDto>();
  @Output() deleteClass     = new EventEmitter<string>();
  @Output() toggleSelect    = new EventEmitter<string>();
  @Output() toggleSelectAll = new EventEmitter<boolean>();
  @Output() viewClass       = new EventEmitter<ClassesDto>(); // ✅ new output (optional — for parent routing)

  _selectedIds: Set<string> = new Set();

  /** ✅ Controls the inline detail overlay */
  selectedClass: ClassesDto | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedIds']) {
      this._selectedIds = new Set(this.selectedIds);
    }
    if (changes['classes']) {
      console.log('[ClassList] classes changed:', this.classes.length);
    }
    if (changes['isLoading']) {
      console.log('[ClassList] isLoading changed:', this.isLoading);
    }
    this.cdr.markForCheck();
  }

  get allSelected(): boolean {
    return this.classes.length > 0 && this.classes.every(c => this._selectedIds.has(c.id));
  }

  get someSelected(): boolean {
    return this._selectedIds.size > 0 && !this.allSelected;
  }

  trackById(_: number, item: ClassesDto): string {
    return item.id;
  }

  /** ✅ Open detail overlay */
  onViewClass(cls: ClassesDto): void {
    console.log("VIEW CLICKED", cls);
    this.selectedClass = cls;
    this.viewClass.emit(cls); // also bubble up to parent (for routing if needed)
    this.cdr.markForCheck();
  }

  /** ✅ Edit triggered from detail overlay — close detail, open edit */
  onDetailEdit(cls: ClassesDto): void {
    this.selectedClass = null;
    this.editClass.emit(cls);
    this.cdr.markForCheck();
  }

  /** ✅ Delete triggered from detail overlay */
  onDetailDelete(id: string): void {
    this.selectedClass = null;
    this.deleteClass.emit(id);
    this.cdr.markForCheck();
  }
}