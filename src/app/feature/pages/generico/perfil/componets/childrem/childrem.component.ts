import { NgFor } from '@angular/common';
import { Component, EventEmitter, inject, Input, input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormControlName, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { onlyNumberValidator } from 'src/app/core/directive/only-number-validator.directive';

@Component({
  selector: 'app-childrem',
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
  templateUrl: './childrem.component.html',
  styleUrl: './childrem.component.css'
})
export class ChildremComponent implements OnInit {
  //Injections
  private fb = inject(FormBuilder);
  
  // Decorators
  @Input() typeDni: any;
  @Input() form: FormGroup;
  // @Output() onPasarValor = new EventEmitter<any>();

  types: any[] = [
    { id: 'V', name: 'Venezolano'},
    { id: 'E', name: 'Extra'},
  ];

  ngOnInit(): void {
    this.form.markAllAsTouched();
    this.form.patchValue(this.typeDni);
  }

  save() {
    console.log(this.form.getRawValue());
  }
}
