import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlateTableComponent } from './plate-table.component';

describe('PlateTableComponent', () => {
  let component: PlateTableComponent;
  let fixture: ComponentFixture<PlateTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlateTableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PlateTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
