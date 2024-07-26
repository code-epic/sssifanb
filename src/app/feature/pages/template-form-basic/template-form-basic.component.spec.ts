import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateFormBasicComponent } from './template-form-basic.component';

describe('TemplateFormBasicComponent', () => {
  let component: TemplateFormBasicComponent;
  let fixture: ComponentFixture<TemplateFormBasicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateFormBasicComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TemplateFormBasicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
