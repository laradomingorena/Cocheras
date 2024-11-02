import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Cochera } from '../../interfaces/cocheras';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Inject } from '@angular/core';
import Swal from 'sweetalert2';
import { EstacionamientoService } from '../../services/estacionamiento.service';
import { CocherasService } from '../../services/cocheras.service';
import { Estacionamiento } from '../../interfaces/estacionamiento';

@Component({
  selector: 'app-estado-cocheras',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './estado-cocheras.component.html',
  styleUrl: './estado-cocheras.component.scss'
})
export class EstadoCocherasComponent {


titulo: string = 'Estado de la cochera';
header:{nro: string, disponibilidad: string, ingreso:string, acciones: string } = {
  nro: 'Nro',
  disponibilidad: 'Disponibilidad',
  ingreso: 'Ingreso',
  acciones: 'Acciones',
};
filas: (Cochera &{ activo: Estacionamiento|null})[]=[];
ngOnInit(){
  this.traerCocheras();
}
auth=inject(AuthService);
estacionamientos=inject(EstacionamientoService);
cocheras=inject(CocherasService);

siguienteNumero: number = 1;

traerCocheras() {
  return this.cocheras.cocheras().then(cocheras => {
    this.filas = [];

    for (let cochera of cocheras) {
      this.estacionamientos.buscarEstacionamientoActivo(cochera.id).then(estacionamiento => {
        this.filas.push({
          ...cochera,
          activo: estacionamiento,
        });
      })
    };
  });
}
  agregarFila() {
    fetch('http://localhost:4000/cocheras/', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + this.auth.getToken(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ descripcion: "Agregada por API" })
    }).then(() => {
      this.traerCocheras();
    });
  }
  eliminarFila(cocheraId: number, event:Event) {
    fetch('http://localhost:4000/cocheras/' + cocheraId, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + this.auth.getToken(),
      },
    }).then(()=>{
      this.traerCocheras();
    });
  }
  cambiarDisponibilidadCochera(cocheraId:number, event: Event){
    fetch ('http://localhost:4000/cocheras/1/disable')
    
  }
  abrirModalNuevoEstacionamiento(idCochera:number){
    console.log("abriendo modal cochera", idCochera)
     Swal.fire({
      title: "Ingrese la patente del vehiculo",
      input: "text",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "Ingrese una patente valida";
        }
        return
      }
    }).then(res=>{
      if(res.isConfirmed){
        console.log("Tengo que estacionar la patente", res.value);
        this.estacionamientos.estacionarAuto(res.value, idCochera);
      }
    }) 
    }
  
getCocheras(){
  fetch("https://localhost:4000/cocheras",{
    headers:{
      authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiZXNBZG1pbiI6MSwiaWF0IjoxNzI2NjcxMTg3LCJleHAiOjE3MjcyNzU5ODd9.1EEQcqsXQc-nBUR8M-ZokVbn550mls6HLHgjmEJBkxE'
    },
  });
  }
}