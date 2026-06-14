// Swaps the nav "Log in" link to "Account" when the visitor is signed in.
import { getSession } from '/auth-cognito.js';
if (getSession()) {
  document.querySelectorAll('.nav-login, .mobile-menu-login').forEach((a) => {
    a.textContent = 'Dashboard';
    a.setAttribute('href', '/app');
  });
}
