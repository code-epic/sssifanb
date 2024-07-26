import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateFormFileComponent } from './template-form-file.component';

describe('TemplateFormFileComponent', () => {
  let component: TemplateFormFileComponent;
  let fixture: ComponentFixture<TemplateFormFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateFormFileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TemplateFormFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
