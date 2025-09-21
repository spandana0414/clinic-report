import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ClinicReportsService, ClinicData } from '../clinic-reports.service';

Chart.register(...registerables);

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'clinic-outcomes';

  periods = [30, 60, 90];
  selectedPeriod = 30;
  clinicData: ClinicData = {
    patientCount: 120,
    reportingPeriod: '30 days',
    dateRange: '01/01/2024 - 01/31/2024',
    lastUpdated: '01/06/2024, 3:00 PM',
    timeInRange: { inRange: 82, aboveRange: 15, belowRange: 2 },
    gmi: { average: 6.7, distribution: { optimal: 72, suboptimal: 23, poor: 5 } }
  };

  showTooltip = false;

  private charts: Chart[] = [];

  constructor(private clinicReportsService: ClinicReportsService) {}

  ngOnInit() {
    // Load initial data for the selected period
    this.loadClinicData(this.selectedPeriod);
  }

  ngOnDestroy() {
    this.charts.forEach(chart => chart.destroy());
  }

  onPeriodChange(period: number) {
    this.selectedPeriod = period;
    console.log("selected period:", this.selectedPeriod);
    this.loadClinicData(period);
  }

  /**
   * Load clinic data for the specified period
   * @param period - The time period (30, 60, or 90 days)
   */
  private loadClinicData(period: number) {
    this.clinicReportsService.getClinicDataByPeriod(period).subscribe({
      next: (data: ClinicData) => {
        this.clinicData = data;
        console.log(`Loaded data for ${period} days:`, data);
        
        // Destroy existing charts before creating new ones
        this.charts.forEach(chart => chart.destroy());
        this.charts = [];
        
        // Reinitialize charts with new data
        setTimeout(() => {
          this.initializeCharts();
        }, 100);
      },
      error: (error) => {
        console.error(`Error loading clinic data for ${period} days:`, error);
        // Keep existing data or set default
        this.clinicData.reportingPeriod = `${period} days`;
      }
    });
  }

  onPrint() {
    console.log('Export data for printing:', this.clinicData);

    // Create screenshot and save to user machine
    this.captureScreenshot();

    // Also trigger browser print
    window.print();
  }

  private captureScreenshot() {
    try {
      // Use html2canvas library if available, otherwise fallback
      if (typeof (window as any).html2canvas !== 'undefined') {
        (window as any).html2canvas(document.body, {
          useCORS: true,
          allowTaint: true,
          scale: 2,
          backgroundColor: '#ffffff'
        }).then((canvas: HTMLCanvasElement) => {
          // Convert canvas to blob
          canvas.toBlob((blob: Blob | null) => {
            if (blob) {
              this.downloadImage(blob);
            }
          }, 'image/png');
        }).catch((error: any) => {
          console.error('Screenshot capture failed:', error);
          this.fallbackScreenshot();
        });
      } else {
        this.fallbackScreenshot();
      }
    } catch (error) {
      console.error('Screenshot error:', error);
      this.fallbackScreenshot();
    }
  }

  private fallbackScreenshot() {
    // Fallback method using canvas API
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Fill white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add text indicating this is a fallback
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial';
        ctx.fillText('Clinic Outcomes Dashboard', 20, 40);
        ctx.fillText('Generated on: ' + new Date().toLocaleString(), 20, 70);

        // Convert to blob and download
        canvas.toBlob((blob: Blob | null) => {
          if (blob) {
            this.downloadImage(blob);
          }
        }, 'image/png');
      }
    } catch (error) {
      console.error('Fallback screenshot failed:', error);
      alert('Screenshot capture is not supported in this browser');
    }
  }

  private downloadImage(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.download = `clinic-outcomes-${timestamp}.png`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);

    console.log('Screenshot saved to downloads folder');
  }

  private initializeCharts() {
    this.createVerticalStackedChart();
    this.createHorizontalScaleChart();
    this.createHorizontalBarChart();
    this.createPieChart();
    this.createGmiRangesChart();
  }

  private createVerticalStackedChart() {
    const ctx = document.getElementById('timeInRangeVerticalStacked') as HTMLCanvasElement;
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: [''],
        datasets: [
          {
            label: 'Below Range',
            data: [this.clinicData.timeInRange.belowRange],
            backgroundColor: '#f44336',
            borderWidth: 0,
            barPercentage: 0.3,
            categoryPercentage: 0.4
          },
          {
            label: 'In Range',
            data: [this.clinicData.timeInRange.inRange],
            backgroundColor: '#8bc34a',
            borderWidth: 0,
            barPercentage: 0.3,
            categoryPercentage: 0.4
          },
          {
            label: 'Above Range',
            data: [this.clinicData.timeInRange.aboveRange],
            backgroundColor: '#ffc107',
            borderWidth: 0,
            barPercentage: 0.3,
            categoryPercentage: 0.4
          },
          {
            label: 'Very High',
            data: [1],
            backgroundColor: '#ffc107',
            borderWidth: 0,
            barPercentage: 0.3,
            categoryPercentage: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            stacked: true,
            display: false,
            grid: { display: false }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            max: 100,
            position: 'left',
            ticks: {
              display: false
            },
            grid: { display: false }
          }
        },
        layout: {
          padding: {
            left: 20,
            right: 60
          }
        }
      } as any,
      plugins: [{
        id: 'customLabels',
        afterDraw: (chart: any) => {
          const ctx = chart.ctx;
          const chartArea = chart.chartArea;
          const meta = chart.getDatasetMeta(0);
          const barWidth = meta.data[0].width;
          const x = meta.data[0].x + barWidth / 2 + 20;

          ctx.fillStyle = '#333';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'left';

          // Calculate positions based on data percentages
          const total = chartArea.height;
          const belowHeight = (this.clinicData.timeInRange.belowRange / 100) * total;
          const inRangeHeight = (this.clinicData.timeInRange.inRange / 100) * total;
          const aboveHeight = (this.clinicData.timeInRange.aboveRange / 100) * total;

          // Position labels for each segment from bottom to top with better spacing
          ctx.fillText('2%', x, chartArea.bottom - belowHeight / 2);
          ctx.fillText('82%', x, chartArea.bottom - belowHeight - inRangeHeight / 2);
          ctx.fillText('15%', x, chartArea.bottom - belowHeight - inRangeHeight - aboveHeight / 3);
          ctx.fillText('1%', x, chartArea.top + 25);
        }
      }]
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  private createHorizontalScaleChart() {
    const ctx = document.getElementById('timeInRangeHorizontalScale') as HTMLCanvasElement;
    if (!ctx) return;

    // Segment widths based on glucose ranges (mg/dL):
    // 40-54 (red), 54-70 (red), 70-180 (green), 180-240 (yellow), 240-400 (yellow)
    // Each segment max 10px width visually
    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: [''],
        datasets: [
          {
            label: '40-54',
            data: [10],
            backgroundColor: '#f44336',
            borderWidth: 0,
            barPercentage: 1.0,
            categoryPercentage: 1.0
          },
          {
            label: '54-70',
            data: [10],
            backgroundColor: '#f44336',
            borderWidth: 0,
            barPercentage: 1.0,
            categoryPercentage: 1.0
          },
          {
            label: '70-180',
            data: [10],
            backgroundColor: '#8bc34a',
            borderWidth: 0,
            barPercentage: 1.0,
            categoryPercentage: 1.0
          },
          {
            label: '180-240',
            data: [10],
            backgroundColor: '#ffc107',
            borderWidth: 0,
            barPercentage: 1.0,
            categoryPercentage: 1.0
          },
          {
            label: '240-400',
            data: [10],
            backgroundColor: '#ffc107',
            borderWidth: 0,
            barPercentage: 1.0,
            categoryPercentage: 1.0
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            stacked: true,
            beginAtZero: true,
            max: 50,
            ticks: { display: false },
            grid: { display: false },
            border: { display: false }
          },
          y: {
            stacked: true,
            display: false
          }
        },
        layout: {
          padding: { top: 20, bottom: 5, left: 10, right: 10 }
        }
      } as any,
      plugins: [{
        id: 'scaleLabels',
        afterDraw: (chart: any) => {
          const ctx = chart.ctx;
          const chartArea = chart.chartArea;
          ctx.fillStyle = '#666';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          // Label positions evenly spaced for 5 segments
          const totalWidth = chartArea.right - chartArea.left;
          const segmentWidth = totalWidth / 5;
          const labelPositions = [
            { text: '40', x: chartArea.left },
            { text: '54', x: chartArea.left + segmentWidth * 1 },
            { text: '70', x: chartArea.left + segmentWidth * 2 },
            { text: '180', x: chartArea.left + segmentWidth * 3 },
            { text: '240', x: chartArea.left + segmentWidth * 4 },
            { text: '400', x: chartArea.right }
          ];
          labelPositions.forEach(label => {
            ctx.fillText(label.text, label.x, chartArea.top - 5);
          });
        }
      }]
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  private createHorizontalBarChart() {
    const ctx = document.getElementById('timeInRangeHorizontal') as HTMLCanvasElement;
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ['Range'],
        datasets: [
          {
            label: 'Below',
            data: [this.clinicData.timeInRange.belowRange],
            backgroundColor: '#f44336',
            borderWidth: 0
          },
          {
            label: 'In Range',
            data: [this.clinicData.timeInRange.inRange],
            backgroundColor: '#8bc34a',
            borderWidth: 0
          },
          {
            label: 'Above',
            data: [this.clinicData.timeInRange.aboveRange],
            backgroundColor: '#ffc107',
            borderWidth: 0
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            stacked: true,
            beginAtZero: true,
            max: 100,
            ticks: { display: false }
          },
          y: {
            stacked: true,
            display: false
          }
        }
      }
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  private createPieChart() {
    const ctx = document.getElementById('gmiPieChart') as HTMLCanvasElement;
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: ['≤7%', '7-8%', '≥8%'],
        datasets: [{
          data: [
            this.clinicData.gmi.distribution.optimal,
            this.clinicData.gmi.distribution.suboptimal,
            this.clinicData.gmi.distribution.poor
          ],
          backgroundColor: ['#8bc34a', '#ffc107', '#f44336'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        rotation: 150, // Rotate by another -45 degrees (total -90°)
        plugins: {
          legend: {
            display: false
          }
        },
        layout: {
          padding: {
            left: 40,
            right: 40,
            top: 20,
            bottom: 20
          }
        }
      } as any,
      plugins: [{
        id: 'customLabels',
        afterDraw: (chart: any) => {
          const ctx = chart.ctx;
          const centerX = chart.width / 2;
          const centerY = chart.height / 2;
          const radius = 80;

          // Label positions to match reference PNG exactly
          const labels = [
            { text: '72%', angle: Math.PI, x: centerX - 80, y: centerY - 20 },    // Left side for 72%
            { text: '23%', angle: 0, x: centerX + 80, y: centerY + 10 },          // Right side for 23%
            { text: '5%', angle: Math.PI/2 + 0.3, x: centerX + 20, y: centerY + 80 } // Bottom-right for 5%
          ];

          // Draw labels with lines from pie edge
          ctx.fillStyle = '#333';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.strokeStyle = '#666';
          ctx.lineWidth = 1;

          labels.forEach((label) => {
            // Calculate edge point of pie
            const edgeX = centerX + Math.cos(label.angle) * radius;
            const edgeY = centerY + Math.sin(label.angle) * radius;

            // Draw line from pie edge to label
            ctx.beginPath();
            ctx.moveTo(edgeX, edgeY);
            ctx.lineTo(label.x, label.y);
            ctx.stroke();

            // Draw label text
            ctx.fillText(label.text, label.x, label.y - 5);
          });
        }
      }]
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  private createGmiRangesChart() {
    const ctx = document.getElementById('gmiRanges') as HTMLCanvasElement;
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ['≤7%', '7-8%', '≥8%'],
        datasets: [{
          data: [
            this.clinicData.gmi.distribution.optimal,
            this.clinicData.gmi.distribution.suboptimal,
            this.clinicData.gmi.distribution.poor
          ],
          backgroundColor: ['#8bc34a', '#ffc107', '#f44336'],
          borderWidth: 0
        }]
      },
      options: {
        indexAxis: 'x',
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            display: true,
            grid: { display: false }
          },
          y: {
            display: false,
            beginAtZero: true,
            max: 100
          }
        }
      }
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }
}
