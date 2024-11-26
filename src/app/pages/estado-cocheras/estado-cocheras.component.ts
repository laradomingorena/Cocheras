import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Cochera } from '../../interfaces/cocheras';
import { Tarifa } from '../../interfaces/tarifa';

import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Inject } from '@angular/core';
import Swal from 'sweetalert2';
import { EstacionamientoService } from '../../services/estacionamiento.service';
import { CocherasService } from '../../services/cocheras.service';
import { TarifasService } from '../../services/tarifas.service';
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
  header: { nro: string, disponibilidad: string, ingreso: string, acciones: string } = {
    nro: 'Nro',
    disponibilidad: 'Disponibilidad',
    ingreso: 'Ingreso',
    acciones: 'Acciones',
  };
  filas: (Cochera & { activo: Estacionamiento | null })[] = [];
  ngOnInit() {
    this.traerCocheras();
  }
  auth = inject(AuthService);
  estacionamientos = inject(EstacionamientoService);
  cocheras = inject(CocherasService);
  tarifas = inject(TarifasService);

  siguienteNumero: number = 1;
  costoPorHora: number = 0;

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
      this.traerCocheras().then(() => this.sortCocheras());
    });
  }
  eliminarFila(cocheraId: number) {
    return fetch('http://localhost:4000/cocheras/' + cocheraId, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + this.auth.getToken(),
      },
    }).then(() => {
      this.traerCocheras().then(() => this.sortCocheras());
    });
  }
  cambiarDisponibilidadCochera(cocheraId: number, event: Event) {
    fetch('http://localhost:4000/cocheras/' + cocheraId + '/disable', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + this.auth.getToken(),
      },
    }).then(() => {
      this.traerCocheras().then(() => this.sortCocheras());
    });
  }

  abrirModalNuevoEstacionamiento(idCochera: number) {
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
    }).then(res => {
      if (res.isConfirmed) {
        console.log("Tengo que estacionar la patente", res.value);
        this.estacionamientos.estacionarAuto(res.value, idCochera).then(() => this.traerCocheras()).then(() => this.sortCocheras());
      }
    })
  }
  abrirModalEliminarEstacionamiento(idCochera: number) {
    const cochera = this.filas.find(cochera => cochera.id === idCochera)!;
    if (!cochera.activo) {
      Swal.fire({
        title: "Esta seguro de borrar la cochera?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: "Eliminar Cochera"

      }).then((result) => {
        if (result.isConfirmed) {
          this.eliminarFila(cochera.id).then(() => this.sortCocheras());
        }
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Cochera ocupada",
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
    console.log(tiempoEstacionado);
    const minutosEstacionado = Math.ceil(tiempoEstacionado / 1000 / 60);

    const tarifaSeleccionada = await this.calcularCostoCochera(minutosEstacionado);
    const horasEstacionado = Math.ceil(minutosEstacionado / 60);

    this.costoPorHora = tarifaSeleccionada?.valor!;

    //this.costoPorHora = tarifaSeleccionada[0].valor;


    const total = horasEstacionado * this.costoPorHora;

    const result = await Swal.fire({
      title: 'Cobrar Estacionamiento',
      html: `
      <div>
        <p>Patente: ${cochera.activo.patente}</p>
        <p>Hora de ingreso: ${horaIngreso.toLocaleString()}</p>
        <p>Tiempo estacionado: ${horasEstacionado} hora(s)</p>
        <p>Costo Por Hora: $${this.costoPorHora}</p>

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
        await fetch(`http://localhost:4000/estacionamientos/cerrar`, {
          method: 'PATCH',
          headers: {
            'Authorization': 'Bearer ' + this.auth.getToken(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            patente: cochera.activo.patente,
            idUsuarioEgreso: "admin"
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
  /*abrirModalCobroCochera(cocheraId:number){
    const cochera = this.filas.find(cochera => cochera.id === cocheraId)!;
    this.estacionamientos.cerrar(cochera.activo?.patente!).then((res) => {
      return Swal.fire({
        title: "Cobro cochera",
        text: `El monto a cobrar por el tiempo estacionado en la cochera ${cocheraId} es $${res.costo}`,
        icon: "info",
        confirmButtonText: "Cobrar"
      }).then((result) => {
        if (result.isConfirmed) {
          const Toast = Swal.mixin({
            toast: true,
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.onmouseenter = Swal.stopTimer;
              toast.onmouseleave = Swal.resumeTimer;
            }
          })
        }
      }).then(() => this.reloadCocheras()).then(()=> this.ordenarCocheras());
    })
  }*/


  sortCocheras() {
    this.filas.sort((a, b) => a.id > b.id ? 1 : -1)
  }

  async calcularCostoCochera(minutosPasados: number) {
    //let costo = 0;
    //if (minutosPasados <= 0) {
    //  return costo;
    //}

    let tarifaABuscar;
    if (minutosPasados <= 30) {
      tarifaABuscar = "MEDIAHORA"
    } else if (minutosPasados <= 60) {
      tarifaABuscar = "PRIMERAHORA"
    } else {
      tarifaABuscar = "VALORHORA"
    }

    //return this.tarifas.tarifas().then(function (result) {
    //  return result.find(function (rowTarifa) {

    //    if (rowTarifa?.id === tarifaABuscar) {
    //        return rowTarifa;
    //      }


    //    return 0;
    //  });
    //});

    return this.tarifas.tarifas().then(result => result.find(rowTarifa => rowTarifa.id === tarifaABuscar));

  }


  getCocheras() {
    fetch("https://localhost:4000/cocheras", {
      headers: {
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiZXNBZG1pbiI6MSwiaWF0IjoxNzI2NjcxMTg3LCJleHAiOjE3MjcyNzU5ODd9.1EEQcqsXQc-nBUR8M-ZokVbn550mls6HLHgjmEJBkxE'
      },
    });
  }
}
