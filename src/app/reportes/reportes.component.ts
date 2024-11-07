
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';
import { HeaderComponent } from '../components/header/header.component';
import { Estacionamiento } from '../interfaces/estacionamiento';
import { EstacionamientoService } from '../services/estacionamiento.service';
import { Reporte } from '../interfaces/reportes';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [RouterModule, CommonModule, HeaderComponent],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent {
  estacionamientos = inject(EstacionamientoService);
  historialEstacionamientos: Estacionamiento[] = [];
  reporteEstacionamientos: Reporte[] = [];

  ngOnInit() {
    this.reloadReporte();
  }

  reloadReporte() {
    this.estacionamientos.cargar() // Cargar los datos de los estacionamientos
      .then(estacionadas => {
        if (!Array.isArray(estacionadas)) {
          // Verificamos si 'estacionadas' es un array válido
          console.error("Los datos cargados no son un array");
          return;
        }

        // Filtrar solo los estacionamientos con hora de egreso (es decir, ya cobrados)
        for (let estacionada of estacionadas) {
          if (estacionada.horaEgreso != null) {
            this.historialEstacionamientos.push(estacionada);
          }
        }

        // Ordenamos los estacionamientos por hora de ingreso
        this.historialEstacionamientos.sort((a, b) => {
          if (a.horaIngreso > b.horaIngreso) {
            return 1;
          }
          if (a.horaIngreso < b.horaIngreso) {
            return -1;
          }
          return 0;
        });

        // Inicializamos un array para los meses de trabajo
        let mesesTrabajo: string[] = [];
        const meses = [
          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];

        // Ahora generamos los reportes por mes
        for (let estacionada of this.historialEstacionamientos) {
          const estacionadaConDate = { ...estacionada, horaIngreso: new Date(estacionada.horaIngreso) };
          const periodo = meses[estacionadaConDate.horaIngreso.getMonth()] + " " + estacionadaConDate.horaIngreso.getFullYear();

          if (!mesesTrabajo.includes(periodo)) {
            // Si no hemos agregado este mes, lo añadimos al reporte
            mesesTrabajo.push(periodo);
            this.reporteEstacionamientos.push({
              nro: this.reporteEstacionamientos.length + 1,
              mes: periodo,
              usos: 1,
              cobrado: estacionada.costo ?? 0
            });
          } else {
            // Si ya existe el mes en el reporte, actualizamos los datos
            const reporte = this.reporteEstacionamientos.find(r => r.mes === periodo)!;
            reporte.usos++;
            reporte.cobrado += estacionada.costo ?? 0;
          }
        }
      })
      .catch(error => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar el reporte de estacionamientos.',
          icon: 'error'
        });
        console.error('Error al cargar estacionamientos:', error);
      });
  }
}