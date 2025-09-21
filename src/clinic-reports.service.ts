import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Interface for clinic data structure
export interface ClinicData {
  patientCount: number;
  reportingPeriod: string;
  dateRange: string;
  lastUpdated: string;
  timeInRange: {
    inRange: number;
    aboveRange: number;
    belowRange: number;
  };
  gmi: {
    average: number;
    distribution: {
      optimal: number;
      suboptimal: number;
      poor: number;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class ClinicReportsService {

  constructor(private http: HttpClient) { }
  
  getClinicDataByPeriod(period: number): Observable<ClinicData> {
    // Map period to corresponding JSON file
    const fileMap: { [key: number]: string } = {
      30: '/resource/30day-results.json',
      60: '/resource/60day-results.json',
      90: '/resource/90day-results.json'
    };

    const filePath = fileMap[period];

    if (!filePath) {
      return of(this.getDefaultData(period));
    }

    return this.http.get<ClinicData>(filePath).pipe(
      map((data: ClinicData) => {
        return data;
      }),
      catchError((error) => {
        return of(this.getDefaultData(period));
      })
    );
  }


  private getDefaultData(period: number): ClinicData {
    return {
      patientCount: 0,
      reportingPeriod: `${period} days`,
      dateRange: 'No data available',
      lastUpdated: new Date().toLocaleString(),
      timeInRange: {
        inRange: 0,
        aboveRange: 0,
        belowRange: 0
      },
      gmi: {
        average: 0,
        distribution: {
          optimal: 0,
          suboptimal: 0,
          poor: 0
        }
      }
    };
  }
}
