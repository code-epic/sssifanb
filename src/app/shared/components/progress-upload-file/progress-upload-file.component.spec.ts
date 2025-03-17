import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressUploadFileComponent } from './progress-upload-file.component';

describe('ProgressUploadFileComponent', () => {
  let component: ProgressUploadFileComponent;
  let fixture: ComponentFixture<ProgressUploadFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressUploadFileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProgressUploadFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
