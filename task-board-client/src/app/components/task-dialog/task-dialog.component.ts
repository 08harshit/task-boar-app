import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ITask } from '@shared/index';

@Component({
    selector: 'app-task-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule
    ],
    template: `
    <h2 mat-dialog-title>{{ data.task ? 'Edit Task' : 'New Task' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="taskForm" class="task-form">
        <mat-form-field appearance="outline">
          <mat-label>Task Title</mat-label>
          <input matInput formControlName="title" placeholder="What needs to be done?">
          <mat-error *ngIf="taskForm.get('title')?.hasError('required')">Title is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Details</mat-label>
          <textarea matInput formControlName="details" rows="3" placeholder="Add more context..."></textarea>
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Priority</mat-label>
            <mat-select formControlName="priority">
              <mat-option value="low">Low</mat-option>
              <mat-option value="medium">Medium</mat-option>
              <mat-option value="high">High</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Due Date</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="due_date">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="taskForm.invalid" (click)="save()">
        {{ data.task ? 'Save Changes' : 'Create Task' }}
      </button>
    </mat-dialog-actions>
  `,
    styles: [`
    .task-form { display: flex; flex-direction: column; gap: 8px; padding: 8px 0; min-width: 400px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    mat-form-field { width: 100%; }
  `]
})
export class TaskDialogComponent {
    taskForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<TaskDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { task?: ITask }
    ) {
        this.taskForm = this.fb.group({
            title: [data.task?.title || '', Validators.required],
            details: [data.task?.details || ''],
            priority: [data.task?.priority || 'medium'],
            due_date: [data.task?.due_date ? new Date(data.task.due_date) : null]
        });
    }

    save() {
        if (this.taskForm.valid) {
            this.dialogRef.close(this.taskForm.value);
        }
    }
}
