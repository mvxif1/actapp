import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard: () => boolean | import("@angular/router").UrlTree = () => {
  const router = inject(Router);
  const isLoggedIn = localStorage.getItem('email') !== '';

  if (!isLoggedIn) {
    // Si no está logueado, redirige al login
    return router.parseUrl('/home');
  }
  return true; // Permite la navegación si está logueado
};


