import { Component, OnInit } from '@angular/core';
import { FormGroup, UntypedFormControl, UntypedFormBuilder, Validators} from '@angular/forms';
import {FormsModule,ReactiveFormsModule} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatStepper, MatStep, MatStepLabel, MatStepperNext, MatStepperPrevious } from '@angular/material/stepper';
import { MatDialogTitle, MatDialogContent } from '@angular/material/dialog';


@Component({
    selector: 'app-hechicero',
    templateUrl: './hechicero.component.html',
    styleUrls: ['./hechicero.component.scss'],
    standalone: true,
    imports: [
        MatDialogTitle,
        MatDialogContent,
        MatStepper,
        MatStep,
        FormsModule,
        ReactiveFormsModule,
        MatStepLabel,
        MatFormField,
        MatLabel,
        MatSelect,
        MatOption,
        MatInput,
        MatIcon,
        MatSuffix,
        MatButton,
        MatStepperNext,
        MatStepperPrevious,
    ],
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
