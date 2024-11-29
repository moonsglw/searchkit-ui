import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationsTabComponent } from './applications-tab.component';

describe('ApplicationsTabComponent', () => {
  let component: ApplicationsTabComponent;
  let fixture: ComponentFixture<ApplicationsTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsTabComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ApplicationsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
