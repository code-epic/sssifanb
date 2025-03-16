import { NgFor } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';

@Component({
  selector: 'app-form-upload',
  standalone: true,
  imports: [  
    MatFormField,
    MatLabel,
    MatInput,
    MatSelect,
    ReactiveFormsModule,
    FormsModule, 
    NgFor, 
    MatOption, 
    MatIcon, 
    MatSuffix, 
    MatButton],
  templateUrl: './form-upload.component.html',
  styleUrl: './form-upload.component.css'
})
export class FormUploadComponent {
  @Input() form: FormGroup;
  @Input() hashBs64: any;
  @Output() onSender = new EventEmitter<any>();
  
  selectedFile:File = null;
  fileName:string = '';

  ngOnInit(): void {
    this.form.markAllAsTouched();
  }
  //esto es para recibir la informacion
  onFileSelected(event: any) {
    const file: File = event.target.files[0];

    if (file) {
      this.selectedFile = file;
      this.fileName = file.name;
      
      this.uploadFile();
    } else {
      this.fileName = '';
      this.selectedFile = null;
    }
  }

  uploadFile() {
    if (!this.selectedFile) {
      return; // No file selected
    }

    const formData = new FormData();
    formData.append('archivos', this.selectedFile);
    formData.append('identificador', this.hashBs64);
    this.onSender.emit(formData);
    
  }

}
