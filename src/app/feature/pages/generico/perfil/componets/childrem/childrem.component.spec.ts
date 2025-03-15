import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChildremComponent } from './childrem.component';

describe('ChildremComponent', () => {
  let component: ChildremComponent;
  let fixture: ComponentFixture<ChildremComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChildremComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChildremComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
