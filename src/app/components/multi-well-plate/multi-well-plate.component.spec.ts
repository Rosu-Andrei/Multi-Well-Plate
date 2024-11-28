import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiWellPlateComponent } from './multi-well-plate.component';

describe('MultiWellPlateComponent', () => {
  let component: MultiWellPlateComponent;
  let fixture: ComponentFixture<MultiWellPlateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MultiWellPlateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MultiWellPlateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
