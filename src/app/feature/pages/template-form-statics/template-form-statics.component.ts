import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { COMPONENTS_SHARED, MATERIAL_FORM_MODULE, MATERIAL_MODULES } from 'src/app/core/imports/material/material';

@Component({
  selector: 'app-template-form-statics',
  standalone: true,
   imports: [
      ...MATERIAL_MODULES,
      ...MATERIAL_FORM_MODULE,
      ...COMPONENTS_SHARED
    ],
  templateUrl: './template-form-statics.component.html',
  styleUrl: './template-form-statics.component.css'
})
export class TemplateFormStaticsComponent {
 //injections dependencies
  private fb = inject(FormBuilder);

  //variables
  form!:FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      file: new FormData(),
      test1: new FormControl(),
      test2: new FormControl(),
    })
  }
}
