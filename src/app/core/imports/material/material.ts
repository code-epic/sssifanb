import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatTable } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatOption, MatSelect } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgFor, NgStyle } from '@angular/common';
import { ProgressUploadFileComponent } from 'src/app/shared/components/progress-upload-file/progress-upload-file.component';

// MODULOS DE MATERIAL QUE NO SE UTILIZAN FRECUENTEMENTE EJEMPLO PROGRESS, SPINNER, COSAS ASI
export const MATERIAL_MODULES = [
    MatProgressSpinner,
    MatProgressBar,
    NgStyle
];

// MODULOS DE MATERIAL QUE SE UTILIZAN FRECUENTEMENTE
export const MATERIAL_FORM_MODULE = [
    MatFormField,
    MatLabel,
    MatInput,
    MatSelect,
    FormsModule,
    NgFor,
    MatOption,
    MatIcon,
    MatSuffix,
    MatButton,
    MatTable,
    MatPaginator,
    MatSort,
    ReactiveFormsModule
];


//COMPONENTES DE USO MASIVO EN TODA LA APLICACION
export const COMPONENTS_SHARED = [
    ProgressUploadFileComponent
]