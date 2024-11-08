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
  eliminarFila(cocheraId: number) {
    return fetch('http://localhost:4000/cocheras/' + cocheraId, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + this.auth.getToken(),
      },
    }).then(()=>{
      this.traerCocheras();
    });
  }
  cambiarDisponibilidadCochera(cocheraId:number, event: Event){
    fetch ('http://localhost:4000/cocheras/'+cocheraId+'/disable', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + this.auth.getToken(),
      },
    }).then(()=>{
      this.traerCocheras();
    });
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
        this.estacionamientos.estacionarAuto(res.value, idCochera).then(() => this.traerCocheras());
      }
    }) 
    }
    abrirModalEliminarEstacionamiento(idCochera:number){
      const cochera = this.filas.find(cochera => cochera.id === idCochera)!;
      if(!cochera.activo){
        Swal.fire({
          title: "Esta seguro de borrar la cochera?",
          icon: "question",
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: "Eliminar Cochera"
  
        }).then((result)=> {
          if(result.isConfirmed){
            this.eliminarFila(cochera.id).then(()=> this.sortCocheras());
          }
        });
      }else{
        Swal.fire({
          icon:"error",
          title:"Cochera ocupada",
          text: 'Para eliminar la cochera, primero debe cerrarse',
        })
      }

      
    }
async cobrarEstacionamiento(cocheraId: number) {
  const cochera = this.filas.find(f => f.id === cocheraId);
  
  if (!cochera?.activo) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No hay un estacionamiento activo en esta cochera'
    });
    return;
  }

  const horaIngreso = new Date(cochera.activo.horaIngreso);
  const horaActual = new Date();
  const tiempoEstacionado = horaActual.getTime() - horaIngreso.getTime();
  const horasEstacionado = Math.ceil(tiempoEstacionado / (1000 * 60 * 60));
  const costoPorHora = 500; 
  const total = horasEstacionado * costoPorHora;

  const result = await Swal.fire({
    title: 'Cobrar Estacionamiento',
    html: `
      <div>
        <p>Patente: ${cochera.activo.patente}</p>
        <p>Hora de ingreso: ${horaIngreso.toLocaleString()}</p>
        <p>Tiempo estacionado: ${horasEstacionado} hora(s)</p>
        <p>Total a cobrar: $${total}</p>
      </div>
    `,
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: 'Cobrar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await fetch(`http://localhost:4000/estacionamientos/${cochera.activo.id}/finalizar`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + this.auth.getToken(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          horaEgreso: horaActual.toISOString(),
          importe: total
        })
      });

      await Swal.fire({
        title: 'Éxito',
        text: 'Pago procesado correctamente',
        icon: 'success'
      });

      await this.traerCocheras();
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo procesar el pago',
        icon: 'error'
      });
    }
  }
}

    
    sortCocheras(){
      this.filas.sort((a,b)=> a.id > b.id ? 1 : -1)
    }
getCocheras(){
  fetch("https://localhost:4000/cocheras",{
    headers:{
      authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiZXNBZG1pbiI6MSwiaWF0IjoxNzI2NjcxMTg3LCJleHAiOjE3MjcyNzU5ODd9.1EEQcqsXQc-nBUR8M-ZokVbn550mls6HLHgjmEJBkxE'
    },
  });
  }
}