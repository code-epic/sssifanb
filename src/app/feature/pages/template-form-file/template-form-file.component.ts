import { HttpEventType } from '@angular/common/http';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { tap } from 'rxjs';
import { COMPONENTS_SHARED, MATERIAL_FORM_MODULE, MATERIAL_MODULES } from 'src/app/core/imports/material/material';
import { MessageService } from 'src/app/core/services/message/message-service';
import { PerfilService } from 'src/app/core/services/perfil/perfil.service';

@Component({
  selector: 'app-template-form-file',
  standalone: true,
  imports: [
    ...MATERIAL_MODULES,
    ...MATERIAL_FORM_MODULE,
    ...COMPONENTS_SHARED
  ],
  templateUrl: './template-form-file.component.html',
  styleUrl: './template-form-file.component.css'
})
export class TemplateFormFileComponent {
  //injections dependencies
  protected fb = inject(FormBuilder);
  protected message = inject(MessageService);
  protected perfilService = inject(PerfilService);

  //variables
  public form!: FormGroup;
  protected selectedFile: any = null;
  protected fileName: any = '';
  protected fileSize: any = "0 KB"

  // @ViewChild('fileInput') fileInput: ElementRef;

  ngOnInit() {
    this.form = this.fb.group({
      file: new FormControl(null),
      test1: new FormControl({ value: this.fileName, disabled: false }, []),
      test2: new FormControl({ value: this.fileSize, disabled: true }, []),
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.fileName = file.name;
      this.fileSize = this.formatFileSize(file.size);
    } else {
      this.fileName = '';
      this.selectedFile = null;
    }

    this.form.get('test1').setValue(this.fileName);
    this.form.get('test2').setValue(this.fileSize);
  }

  sendFile() {
    this.message.confirm(this.message.CONFIRM_FILE_MESSAGE).then(
      (response) => response == true ? this.successConfirm() : console.log("not confirm"),
      (error) => { console.log("error", error); }
    );
  }

  protected successConfirm() {
    
    const formData = new FormData();
    formData.append('archivos', this.selectedFile);
    formData.append('identificador', this.getHashEncript()); 

    this.perfilService.upload(formData)
      .pipe(
        tap(event => {
          if (event.type === HttpEventType.UploadProgress) {
            // const progressEvent = event as { loaded: number, total: number };
            // this.totalSize = progressEvent.total; // Almacena el tamaño total
            // this.simulateProgress(); // Simula el progreso
          } else if (event.type === HttpEventType.Response) {
            // clearInterval(this.intervalId);
            // this.progress = 100;
            // this.message = "Archivo guardado";
            // this.uploading = false;
          }

        })
      ).subscribe({
        next: (value: any) => {}
      });

  }

  protected formatFileSize(bytes: number): string {
    const kb = 1024;
    const mb = kb * 1024;

    if (bytes < mb) {
      return (bytes / kb).toFixed(2) + ' KB';
    } else {
      return (bytes / mb).toFixed(2) + ' MB';
    }
  }

  protected getHashEncript() {
    return "LT264845722";
  }


}
