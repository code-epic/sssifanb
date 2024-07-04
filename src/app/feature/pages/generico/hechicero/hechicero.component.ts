import { Component, OnInit } from '@angular/core';
import { FormGroup, UntypedFormControl, UntypedFormBuilder, Validators} from '@angular/forms';
import {FormsModule,ReactiveFormsModule} from '@angular/forms';


@Component({
  selector: 'app-hechicero',
  templateUrl: './hechicero.component.html',
  styleUrls: ['./hechicero.component.scss'],
})
export class HechiceroComponent implements OnInit {

  
  isEditable = false;

  grupos : any

  tipologias = new UntypedFormControl('');
  firstFormGroup: FormGroup;
  secondFormGroup:FormGroup;

  constructor(private _formBuilder: UntypedFormBuilder) {}

  // firstFormGroup = this._formBuilder.group({
  //   firstCtrl: ['', Validators.required],
  // });
  // secondFormGroup = this._formBuilder.group({
  //   secondCtrl: ['', Validators.required],
  // });

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.firstFormGroup = this._formBuilder.group({
      firstCtrl: ['', Validators.required],
    });
    this.secondFormGroup = this._formBuilder.group({
      secondCtrl: ['', Validators.required],
    });

  }
}
