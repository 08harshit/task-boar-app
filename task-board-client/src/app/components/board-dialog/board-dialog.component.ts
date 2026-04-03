import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-board-dialog',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
    template: `
    <h2 mat-dialog-title>Initialize New Board</h2>
    <mat-dialog-content>
      <form [formGroup]="boardForm">
        <mat-form-field appearance="outline" style="width: 100%; margin-top: 8px;">
          <mat-label>Board Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Q2 Roadmaps">
          <mat-error *ngIf="boardForm.get('name')?.hasError('required')">Name is required</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="boardForm.invalid" (click)="save()">Create</button>
    </mat-dialog-actions>
  `
})
export class BoardDialogComponent {
    boardForm: FormGroup;
    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<BoardDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.boardForm = this.fb.group({
            name: ['', Validators.required]
        });
    }
    save() { this.dialogRef.close(this.boardForm.value); }
}
