// class-detail.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassesDto } from '../../models/class.model';

@Component({
  selector: 'app-class-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './class-detail.component.html',
  styleUrls: ['./class-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClassDetailComponent {
  @Input({ required: true }) cls!: ClassesDto;

  @Output() close  = new EventEmitter<void>();
  @Output() edit   = new EventEmitter<ClassesDto>();
  @Output() delete = new EventEmitter<string>();
}