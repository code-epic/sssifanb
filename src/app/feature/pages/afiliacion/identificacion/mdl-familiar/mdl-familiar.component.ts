import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-mdl-familiar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mdl-familiar.component.html',
  styleUrls: ['./mdl-familiar.component.scss']
})
export class MdlFamiliarComponent implements OnInit {
  private _familiar: any;
  @Input()
  set familiar(val: any) {
    this._familiar = val;
    console.log('Familiar set:', val);
    if (this.familiarForm) {
      this.populateForm();
    }
  }
  get familiar() { return this._familiar; }

  familiarForm!: FormGroup;
  activeTab: string = 'direccion';

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initForm();
    if (this.familiar) {
      this.populateForm();
    }
  }

  populateForm() {
    console.log('Recibiendo datos del familiar:', this.familiar);
    if (!this.familiar) return;

    const f = this.familiar;
    const p = f.persona;
    const db = p?.datobasico;

    // Helper to parse Mongo Date
    const parseDate = (d: any): string => {
      if (!d) return '';
      let dateVal: Date | null = null;
      if (d.$date) {
        if (typeof d.$date === 'object' && d.$date.$numberLong) {
          dateVal = new Date(parseInt(d.$date.$numberLong, 10));
        } else if (typeof d.$date === 'string') {
          dateVal = new Date(d.$date);
        }
      } else if (typeof d === 'string') {
        dateVal = new Date(d); // ISO string direct
      }

      return (dateVal && !isNaN(dateVal.getTime()))
        ? dateVal.toISOString().split('T')[0]
        : '';
    };

    // Name Concatenation
    const nombres = [db?.nombreprimero, db?.nombresegundo].filter((n: any) => n).join(' ');
    const apellidos = [db?.apellidoprimero, db?.apellidosegundo].filter((n: any) => n).join(' ');

    // Address & Bank (First item)
    const direccion = (p?.direccion && p.direccion.length > 0) ? p.direccion[0] : null;
    const banco = (p?.datofinanciero && p.datofinanciero.length > 0) ? p.datofinanciero[0] : null;

    // Age Calculation
    const birthDateStr = parseDate(db?.fechanacimiento);
    let edad = '';
    if (birthDateStr) {
      const birth = new Date(birthDateStr);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      edad = age.toString();
    }

    this.familiarForm.patchValue({
      // Personal Data
      nacionalidad: db?.nacionalidad || 'V',
      cedula: db?.cedula,
      fechanacimiento: birthDateStr,
      edad: edad,
      sexo: db?.sexo || 'M',
      nombres: nombres,
      apellidos: apellidos,
      edocivil: db?.estadocivil || 'S',
      parentesco: f.parentesco,

      // Status
      situacion: f.condicion || 1,
      beneficio: f.beneficio === true,
      esmilitar: f.esmilitar === true,

      // Contact
      correo: p?.correo?.principal || '',
      telefono: p?.telefono?.movil || p?.telefono?.domiciliario || '',

      // Address
      estado: direccion?.estado || '',
      ciudad: direccion?.ciudad || '',
      municipio: direccion?.municipio || '',
      parroquia: direccion?.parroquia || '',
      calle: direccion?.calleavenida || '',
      casa: direccion?.casa || '',
      apartamento: direccion?.apartamento || '',

      // Bank
      banco_institucion: banco?.institucion || '',
      banco_tipo: banco?.tipo || '',
      banco_cuenta: banco?.cuenta || '',
      banco_autorizado: banco?.autorizado || '',
      banco_titular: banco?.titular || ''
    });
  }

  initForm() {
    this.familiarForm = this.fb.group({
      nacionalidad: ['V', Validators.required],
      cedula: ['', Validators.required],
      fechanacimiento: ['', Validators.required],
      edad: [{ value: '', disabled: true }],
      sexo: ['M', Validators.required],
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      edocivil: ['S'],
      parentesco: ['', Validators.required],
      situacion: [1],
      beneficio: [true],
      esmilitar: [false],

      // Tabs - Direccion
      estado: [''],
      ciudad: [''],
      municipio: [''],
      parroquia: [''],
      calle: [''],
      casa: [''],
      apartamento: [''],
      telefono: [''],
      celular: [''],
      correo: ['', Validators.email],

      // Tabs - Banco
      banco_institucion: [''],
      banco_tipo: [''],
      banco_cuenta: [''],
      banco_autorizado: [''],
      banco_titular: ['']
    });
  }

  get f() { return this.familiarForm.controls; }

  close() {
    this.activeModal.dismiss();
  }

  save() {
    if (this.familiarForm.valid) {
      this.activeModal.close(this.familiarForm.value);
    } else {
      this.familiarForm.markAllAsTouched();
    }
  }

  selectTab(tab: string) {
    this.activeTab = tab;
  }
}
