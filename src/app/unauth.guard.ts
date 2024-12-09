import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const unauthGuard: () => boolean | import("@angular/router").UrlTree = () => {
  const router = inject(Router);
  const isLoggedIn = localStorage.getItem('email') !== '';

  if (isLoggedIn) {
    // Si el usuario está autenticado, redirigir a /inicio
    return router.parseUrl('/inicio');
  }
  return true; // Permitir el acceso si no está autenticado
};
