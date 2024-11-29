import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoginFailed = false;
  errorMessage = '';
  loadingBtn = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initLoginForm();
    this.authService.logout();
  }

  initLoginForm() {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  loginUser() {
    if(this.loginForm.valid){
      this.loadingBtn = true;
      const formValues = this.loginForm.value;
      setTimeout(() => {
        this.authService.login(formValues.username, formValues.password).subscribe(
          () => {
            this.loadingBtn = false;
            //this.router.navigate(['/client']); // Updated to use router navigation
            window.location.href = '/client';
          },
          error => {
            this.loadingBtn = false;
            this.errorMessage = error.message;
            this.messageService.add({ key: 'tc', severity: 'error', summary: 'Ooops! Login failed', detail: this.errorMessage });
          }
        );
      },2000);
      
    }
    else{
      this.messageService.add({
        key: 'tc',
        severity: 'error',
        summary: 'Error',
        detail: 'Username and Password are required.'
      });
    }

    
  }
}
