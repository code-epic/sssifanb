import { Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MATERIAL_MODULES } from 'src/app/core/imports/material/material';

@Component({
  selector: 'app-progress-upload-file',
  standalone: true,
  imports: [
    ...MATERIAL_MODULES,
    
  ],
  templateUrl: './progress-upload-file.component.html',
  styleUrl: './progress-upload-file.component.css'
})
export class ProgressUploadFileComponent {
  private incr = 1;
  public progress = 0;

  timeout = 500;
  @Input() observer$ = new BehaviorSubject<any>(null);
  @Input() file: File;
  message = "Procesando Archivo"

  ngOnInit() {
    let idInterval = setInterval(() => this.manageProgress(), this.timeout)

    this.observer$.subscribe(value => {
      if(value.isTerminate == true) {
        clearInterval(idInterval);
        this.progress = 100;
        this.message = "Archivo subido exitosamente";
      }
    })
  }

  manageProgress() {
    if(this.progress === 100) {
      this.progress = 0;
    } else {
      this.progress = this.progress + this.incr;
    }
  }

}