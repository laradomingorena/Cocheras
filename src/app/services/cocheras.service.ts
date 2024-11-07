import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Cochera } from '../interfaces/cocheras';

@Injectable({
  providedIn: 'root'
})
export class CocherasService {

  auth = inject(AuthService);

  cocheras(): Promise<Cochera[]> {
    return fetch('http://localhost:4000/cocheras', {
      method: 'GET',
      headers: {
        Authorization: "Bearer " + (this.auth.getToken() ?? ''),
      },
    }).then(r => r.json());
  }
}

