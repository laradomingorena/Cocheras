import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Tarifa } from '../interfaces/tarifa';

@Injectable({
  providedIn: 'root'
})
export class TarifasService {

  auth = inject(AuthService);

  tarifas(): Promise<Tarifa[]> {
    return fetch('http://localhost:4000/tarifas', {
      method: 'GET',
      headers: {
        Authorization: "Bearer " + (this.auth.getToken() ?? ''),
      },
    }).then(r => r.json());
  }
}

