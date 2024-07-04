import { Component, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';

@Component({
    selector: 'app-cambiarclave',
    templateUrl: './cambiarclave.component.html',
    styleUrls: ['./cambiarclave.component.scss'],
    standalone: true,
    imports: [
      MatDialogTitle, 
      MatDialogContent, 
      FormsModule, 
      MatFormField, 
      MatLabel, 
      MatInput, 
      MatIcon, 
      MatSuffix, 
      MatDialogActions, 
      MatButton, 
      MatDialogClose]
})
export class CambiarclaveComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
