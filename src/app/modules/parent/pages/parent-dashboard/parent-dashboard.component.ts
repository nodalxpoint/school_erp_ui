// app/modules/parent/pages/parent-dashboard/parent-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParentService } from '../../services/parent.service';
import { ChildStudentDto } from '../../models/parent.model';

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parent-dashboard.component.html',
  styleUrls: ['./parent-dashboard.component.scss']
})
export class ParentDashboardComponent implements OnInit {
  childrenList: ChildStudentDto[] = [];
  selectedChild: ChildStudentDto | null = null;
  showSelectionModal = false;
  isLoadingChildren = false;

  constructor(private parentService: ParentService) {}

  ngOnInit(): void {
    // Check karo ki kya pehle se sessionStorage me koi child select hai?
    this.selectedChild = this.parentService.getActiveChildValue();

    // CHANGES HERE: Login par automatic popup open hone wali logic hata di hai.
    // Ab component load hote hi direct background me list pre-fetch ho jayegi 
    // taaki jab user "Switch Child" click kare to instant data dikhe.
    this.loadChildren();
  }

  loadChildren(): void {
    this.isLoadingChildren = true;
    this.parentService.getChildrenRegistry().subscribe({
      next: (data) => {
        this.childrenList = data;
        this.isLoadingChildren = false;
      },
      error: (err) => {
        console.error('Error fetching children API:', err);
        this.isLoadingChildren = false;
      }
    });
  }

  selectChild(child: ChildStudentDto): void {
    this.parentService.setActiveChild(child);
    this.selectedChild = child;
    this.showSelectionModal = false; // Popup close ho jayega
    
    // Yahan par aap child-specific features reload kar sakte ho!
    console.log('Selected Child:', child.firstName);
  }
}