import { HttpEventType } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Subject, tap } from 'rxjs';
import { COMPONENTS_SHARED, MATERIAL_FORM_MODULE, MATERIAL_MODULES } from 'src/app/core/imports/material/material';
import { MessageService } from 'src/app/core/services/message/message.service';
import { PerfilService } from 'src/app/core/services/perfil/perfil.service';
import { v4 as uuidv4 } from 'uuid';

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
  confimated: boolean = false;
  public observer$ = new Subject<any>();

  //single file
  public form!: FormGroup;
  public fileElements: any[] = [];
  protected fileName: any = '';
  protected fileSize: any = "0 KB";

  //multi file
  public formMulti!: FormGroup;
  public totalSize: number = 0;

  tableColumns = [
    { key: 'name', name: 'Nombre Archivo' },
    { key: 'size', name: 'Tamaño del Archivo' },
  ];

  tableActions = [
    { name: 'delete', handler: (element: any) => this.deleteElement(element) }
  ];

  ngOnInit() {
    this.form = this.fb.group({
      file: new FormControl(null),
      test1: new FormControl({ value: this.fileName, disabled: false }, []),
      test2: new FormControl({ value: this.fileSize, disabled: true }, []),
    });

    this.formMulti = this.fb.group({
      file: new FormControl(null),
      test2: new FormControl({ value: this.fileSize, disabled: true }, []),
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.fileElements.push(file);
      this.fileName = file.name;
      this.fileSize = this.formatFileSize(file.size);
    } else {
      this.fileName = '';
      this.fileElements = [];
    }

    this.form.get('test1').setValue(this.fileName);
    this.form.get('test2').setValue(this.fileSize);
  }

  onMultiFileSelected(event: any, isDrag: boolean = false) {
    let updatedFileElements = [...this.fileElements];

    let files = null;
    if (isDrag == true) {
      files = event;
    } else {
      files = event.target.files;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const size = this.formatFileSize(file.size, false);
      updatedFileElements = [...updatedFileElements, { id: uuidv4(), name: file.name, size }];
      console.log("this.fileElements", updatedFileElements);
    }

    this.fileElements = updatedFileElements;
    this.formMulti.get('file').setValue(null);
    this.formMulti.get('test2').setValue(this.formatFileSize(this.totalSize, true));

  }

  //ACTIONS FOR TABLE
  protected deleteElement(element: any) {
    this.fileElements = this.fileElements.filter(
      (fileElement) => fileElement.id !== element.id
    );
  }

  sendFile() {
    this.confimated = false;
    this.message.confirm(this.message.CONFIRM_FILE_MESSAGE).then(
      (response) => response == true ? this.successConfirm() : console.log("not confirm"),
      (error) => { console.log("error", error); }
    );
  }

  protected successConfirm() {
    const formData = new FormData();

    formData.append('archivos', this.fileElements[0]);
    formData.append('identificador', this.getHashEncript());

    this.perfilService.upload(formData)
      .pipe(
        tap(event => {

          if (event.type === HttpEventType.UploadProgress) {
            this.confimated = true;
          } else if (event.type === HttpEventType.Response) {
            this.observer$.next({
              isTerminate: true,
            });
          }

        })
      ).subscribe({
        next: (value: any) => { }
      });
  }
  protected formatFileSize(bytes: number, isLast: boolean = false): string {
    const kb = 1024;
    const mb = kb * 1024;

    if (isLast == false) {
      this.totalSize += bytes;

      console.log("totalSize", this.totalSize);

    }

    if (bytes < mb) {
      return (bytes / kb).toFixed(2) + ' KB';
    } else {
      return (bytes / mb).toFixed(2) + ' MB';
    }
  }

  protected getHashEncript() {
    return "LT264845722";
  }



  files: File[] = [];

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.onMultiFileSelected(event.dataTransfer.files, true);

    // this.handleFiles(event.dataTransfer.files);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  // handleFiles(files: FileList) {
  //   for (let i = 0; i < files.length; i++) {
  //     this.fileElements.
  //     this.files.push(files[i]);
  //   }
  // }

  removeFile(index: number) {
    this.files.splice(index, 1);
  }

}
