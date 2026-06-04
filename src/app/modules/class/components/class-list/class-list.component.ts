import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassesDto } from '../../models/class.model';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './class-list.component.html',
  styleUrls: ['./class-list.component.scss']
})
export class ClassListComponent {
  @Input() classes: ClassesDto[] = [];
  @Input() isLoading = false;
  @Input() selectedIds: Set<string> = new Set();
  @Output() editClass = new EventEmitter<ClassesDto>();
  @Output() deleteClass = new EventEmitter<string>();
  @Output() toggleSelect = new EventEmitter<string>();
  @Output() toggleSelectAll = new EventEmitter<boolean>();

  get allSelected(): boolean {
    return this.classes.length > 0 && this.classes.every(c => this.selectedIds.has(c.id));
  }

  get someSelected(): boolean {
    return this.selectedIds.size > 0 && !this.allSelected;
  }

  trackById(_: number, item: ClassesDto): string {
    return item.id;
  }
}