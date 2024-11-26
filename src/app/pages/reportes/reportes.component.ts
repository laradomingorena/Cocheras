import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../../components/header/header.component';
import { Inject } from '@angular/core';
import Swal from 'sweetalert2';
import { Estacionamiento } from '../../interfaces/estacionamiento';
import { EstacionamientoService } from '../../services/estacionamiento.service';
import { Reporte } from "../../interfaces/reportes";


@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [RouterModule, CommonModule, HeaderComponent],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss'
})
export class ReportesComponent {


  titulo: string = 'Reportes';
  //header: { nro: string, disponibilidad: string, ingreso: string, acciones: string } = {
  //  nro: 'Nro',
  //  disponibilidad: 'Disponibilidad',
  //  ingreso: 'Ingreso',
  //  acciones: 'Acciones',
  //};


  estacionamientos = inject(EstacionamientoService);

  estCerrados: Estacionamiento[] = [];

  reporte: Reporte[] = [];

  ngOnInit() {
    this.cargarReporte();
  }
  auth = inject(AuthService);

  siguienteNumero: number = 1;
  costoPorHora: number = 0;

  async cargarReporte() {
  try {
    const estacionamientos = await this.estacionamientos.traerLista();

    const estCerrados = estacionamientos
      .filter(est => est.horaEgreso !== null) 
      .map(est => ({ ...est, horaIngreso: new Date(est.horaIngreso) })) 
      .sort((a, b) => a.horaIngreso.getTime() - b.horaIngreso.getTime()); 

    const mesesTrabajo = new Map<string, { usos: number; cobrado: number }>();
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    estCerrados.forEach(est => {
      const month = est.horaIngreso.getMonth();
      const year = est.horaIngreso.getFullYear();
      const periodo = `${meses[month]} ${year}`;

      if (!mesesTrabajo.has(periodo)) {
        mesesTrabajo.set(periodo, { usos: 1, cobrado: est.costo ?? 0 });
      } else {
        const reporte = mesesTrabajo.get(periodo)!;
        reporte.usos++;
        reporte.cobrado += est.costo ?? 0;
      }
    });

    this.reporte = Array.from(mesesTrabajo.entries()).map(([mes, data], index) => ({
      nro: index + 1,
      mes,
      usos: data.usos,
      cobrado: data.cobrado,  // Keep `cobrado` as a number
      cobradoFormatted: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(data.cobrado)
    }));
  } catch (error) {
    console.error("Error cargando reporte:", error);
  }
}

}
