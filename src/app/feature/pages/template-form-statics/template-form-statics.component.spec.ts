import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateFormStaticsComponent } from './template-form-statics.component';

describe('TemplateFormStaticsComponent', () => {
  let component: TemplateFormStaticsComponent;
  let fixture: ComponentFixture<TemplateFormStaticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateFormStaticsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TemplateFormStaticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
