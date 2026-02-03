import { HttpEventType } from '@angular/common/http';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { Subject, tap } from 'rxjs';
import { COMPONENTS_SHARED, MATERIAL_FORM_MODULE, MATERIAL_MODULES } from 'src/app/core/imports/material/material';
import { MessageService } from 'src/app/core/services/message/message.service';
import { PerfilService } from 'src/app/core/services/perfil/perfil.service';

@Component({
  selector: 'app-template-form-picture',
  standalone: true,
  imports: [
    ...MATERIAL_MODULES,
    ...MATERIAL_FORM_MODULE,
    ...COMPONENTS_SHARED
  ],
  templateUrl: './template-form-picture.component.html',
  styleUrl: './template-form-picture.component.css'
})
export class TemplateFormPictureComponent {
  @ViewChild('videoElement') videoElement!: ElementRef;
  @ViewChild('fileInput') fileInput: ElementRef;

  private message = inject(MessageService);
  private perfilService = inject(PerfilService);

  imageUrl: string | null = null;
  showCamera: boolean = false;
  videoStream: MediaStream | null = null;
  selectedFile: File | null = null;
  fileType: string | null = null;

  public confimated: boolean = false;
  public observer$ = new Subject<any>();

  openCamera() {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        console.log('Stream:', stream); // Verificar la transmisión de video

        if (this.videoElement && this.videoElement.nativeElement) {
          this.videoElement.nativeElement.srcObject = stream;
          this.videoElement.nativeElement.autoplay = true;
          this.videoElement.nativeElement.playsInline = true;
          this.showCamera = true;
          this.imageUrl = null;
        } else {
          console.error('Elemento <video> no encontrado.');
          alert('Error: Elemento <video> no encontrado.');
        }
      })
      .catch((error) => {
        console.error('Error al acceder a la cámara:', error);
        alert('No se pudo acceder a la cámara. Asegúrate de que la cámara esté conectada y los permisos estén habilitados.');
      });
  }

  openFilePicker() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      console.log(this.selectedFile); // Verificar el archivo seleccionado
      this.fileType = this.selectedFile.type;
      console.log(this.fileType); //Verificar el tipo de archivo.

      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (this.fileType.startsWith('image/')) {
          this.imageUrl = e.target.result;
        } else if (this.fileType === 'application/pdf') {
          this.imageUrl = e.target.result;
        } else if (
          this.fileType ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          this.imageUrl = null;
          alert('Los archivos Word no se pueden previsualizar directamente.');
        } else {
          this.imageUrl = e.target.result;
        }
      };
      reader.onerror = (error) => {
        console.error('Error al leer el archivo:', error);
        alert('Error al leer el archivo.');
      };
      reader.readAsDataURL(this.selectedFile);
    }
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
    formData.append('image', this.selectedFile, this.selectedFile.name);

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
}