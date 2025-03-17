import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgFor, NgStyle } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatPaginator } from '@angular/material/paginator';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableModule } from '@angular/material/table';
import { DynamicTableComponent } from 'src/app/feature/pages/generico/dynamic-table/dynamic-table.component';
import { ProgressUploadFileComponent } from 'src/app/shared/components/progress-upload-file/progress-upload-file.component';

// MODULOS DE MATERIAL QUE NO SE UTILIZAN FRECUENTEMENTE EJEMPLO PROGRESS, SPINNER, COSAS ASI
export const MATERIAL_MODULES = [
    MatProgressSpinner,
    MatProgressBar,
    NgStyle,
    MatTableModule,
    DragDropModule
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
    ProgressUploadFileComponent,
    DynamicTableComponent
]