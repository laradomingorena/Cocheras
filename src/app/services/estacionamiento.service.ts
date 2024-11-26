import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Estacionamiento } from '../interfaces/estacionamiento';

@Injectable({
  providedIn: 'root'
})
export class EstacionamientoService {
  cargar() {
      throw new Error('Method not implemented.');
  }
  auth = inject(AuthService)

  estacionamientos(): Promise<Estacionamiento[]> {
    return fetch('http://localhost:4000/estacionamientos',{
      method: 'GET',
      headers: {
        Authorization: "Bearer " + (this.auth.getToken()?? ''),
      },
    }).then(r => r.json());
  }

  traerLista(): Promise<Estacionamiento[]> {
    return fetch("http://localhost:4000/estacionamientos", {
      method: "GET",
      headers: {
        authorization: "Bearer " + (this.auth.getToken() ?? "")
      },
    }).then(res => res.json());
  }

  buscarEstacionamientoActivo(cocheraId: number){
    return this.estacionamientos().then(estacionamientos => {
      let buscado = null;
      for (let estacionamiento of estacionamientos){
        if(estacionamiento.idCochera=== cocheraId && 
          estacionamiento.horaEgreso=== null) {
          buscado=estacionamiento;
          }
      }
      return buscado;
    });
  }
  estacionarAuto(patenteAuto: string, idCochera: number){
    return fetch('http://localhost:4000/estacionamientos/abrir',{
      method: 'POST',
      headers:{
         Authorization: "Bearer "+ (this.auth.getToken()??''),
         "content-type": "application/json"
        },
        body: JSON.stringify ({
          patente: patenteAuto,
          idCochera: idCochera,
          idUsuarioIngreso: "admin"
        })
    }).then (r=> r.json());
    
  }
}
