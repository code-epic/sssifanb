import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CargarNominaComponent } from './cargar-nomina.component';

describe('CargarNominaComponent', () => {
  let component: CargarNominaComponent;
  let fixture: ComponentFixture<CargarNominaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargarNominaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CargarNominaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
