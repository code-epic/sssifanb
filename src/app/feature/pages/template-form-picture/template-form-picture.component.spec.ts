import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateFormPictureComponent } from './template-form-picture.component';

describe('TemplateFormPictureComponent', () => {
  let component: TemplateFormPictureComponent;
  let fixture: ComponentFixture<TemplateFormPictureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateFormPictureComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TemplateFormPictureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
