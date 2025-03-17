import { Component } from '@angular/core';
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

  ngOnInit() {
    setInterval(() => this.manageProgress(), 150 )
  }

  manageProgress() {
    if(this.progress === 100) {
      this.progress = 0;
    } else {
      this.progress = this.progress + this.incr;
    }
  }

}