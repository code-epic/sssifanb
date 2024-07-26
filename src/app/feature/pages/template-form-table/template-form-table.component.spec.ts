import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateFormTableComponent } from './template-form-table.component';

describe('TemplateFormTableComponent', () => {
  let component: TemplateFormTableComponent;
  let fixture: ComponentFixture<TemplateFormTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateFormTableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TemplateFormTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
