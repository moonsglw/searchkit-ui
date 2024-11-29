import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LearnersTabComponent } from './learners-tab.component';

describe('LearnersTabComponent', () => {
  let component: LearnersTabComponent;
  let fixture: ComponentFixture<LearnersTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LearnersTabComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LearnersTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
