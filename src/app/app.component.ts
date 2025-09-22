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

    // Wait for charts to fully render before capturing screenshot
    setTimeout(() => {
      this.captureScreenshot();
    }, 1000); // 1 second delay to ensure charts are rendered
  }

  private captureScreenshot() {
    try {
      // Target the specific dashboard container
      const dashboardElement = document.querySelector('.clinic-outcomes-app') as HTMLElement;

      if (!dashboardElement) {
        console.error('Dashboard element not found');
        this.fallbackScreenshot();
        return;
      }

      // Check if html2canvas is available
      if (typeof (window as any).html2canvas !== 'undefined') {
        console.log('Using html2canvas for screenshot');

        (window as any).html2canvas(dashboardElement, {
          useCORS: true,
          allowTaint: false,
          scale: 1.5,
          backgroundColor: '#ffffff',
          width: dashboardElement.offsetWidth,
          height: dashboardElement.offsetHeight,
          scrollX: 0,
          scrollY: 0,
          logging: true, // Enable logging for debugging
          onclone: function(clonedDoc: Document) {
            // Ensure all canvas elements are visible in the clone
            const canvases = clonedDoc.querySelectorAll('canvas');
            canvases.forEach((canvas: any, index: number) => {
              const originalCanvas = dashboardElement.querySelectorAll('canvas')[index] as HTMLCanvasElement;
              if (originalCanvas && originalCanvas.getContext('2d')) {
                const ctx = canvas.getContext('2d');
                if (ctx && originalCanvas.width > 0 && originalCanvas.height > 0) {
                  canvas.width = originalCanvas.width;
                  canvas.height = originalCanvas.height;
                  ctx.drawImage(originalCanvas, 0, 0);
                }
              }
            });
          },
          ignoreElements: function(element: any) {
            return element.classList && (
              element.classList.contains('info-tooltip') ||
              element.tagName === 'SCRIPT'
            );
          }
        }).then((canvas: HTMLCanvasElement) => {
          console.log('Screenshot captured successfully');
          // Convert canvas to blob
          canvas.toBlob((blob: Blob | null) => {
            if (blob) {
              this.downloadImage(blob);
            } else {
              console.error('Failed to create blob from canvas');
              this.fallbackScreenshot();
            }
          }, 'image/png', 0.95);
        }).catch((error: any) => {
          console.error('html2canvas failed:', error);
          this.fallbackScreenshot();
        });
      } else {
        console.log('html2canvas not available, using fallback');
        this.fallbackScreenshot();
      }
    } catch (error) {
      console.error('Screenshot error:', error);
      this.fallbackScreenshot();
    }
  }

  private fallbackScreenshot() {
    // Enhanced fallback method with dashboard data
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Set canvas size
        canvas.width = 800;
        canvas.height = 600;

        // Fill white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add title and data
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Clinic Outcomes Dashboard', 50, 50);

        ctx.font = '16px Arial';
        ctx.fillText(`Generated on: ${new Date().toLocaleString()}`, 50, 80);
        ctx.fillText(`Period: ${this.clinicData.reportingPeriod}`, 50, 110);
        ctx.fillText(`Patients: ${this.clinicData.patientCount}`, 50, 140);
        ctx.fillText(`Date Range: ${this.clinicData.dateRange}`, 50, 170);

        // Time in Range data
        ctx.font = 'bold 18px Arial';
        ctx.fillText('Time in Range:', 50, 220);
        ctx.font = '14px Arial';
        ctx.fillText(`Below Range: ${this.clinicData.timeInRange.belowRange}%`, 70, 250);
        ctx.fillText(`In Range: ${this.clinicData.timeInRange.inRange}%`, 70, 280);
        ctx.fillText(`Above Range: ${this.clinicData.timeInRange.aboveRange}%`, 70, 310);

        // GMI data
        ctx.font = 'bold 18px Arial';
        ctx.fillText('Glucose Management Indicator (GMI):', 50, 360);
        ctx.font = '14px Arial';
        ctx.fillText(`Average GMI: ${this.clinicData.gmi.average}%`, 70, 390);
        ctx.fillText(`≤7%: ${this.clinicData.gmi.distribution.optimal}%`, 70, 420);
        ctx.fillText(`7-8%: ${this.clinicData.gmi.distribution.suboptimal}%`, 70, 450);
        ctx.fillText(`≥8%: ${this.clinicData.gmi.distribution.poor}%`, 70, 480);

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
            grid: { display: false },
            border: { display: false }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            max: 100,
            position: 'left',
            display: false,
            ticks: {
              display: false
            },
            grid: { display: false },
            border: { display: false }
          }
        },
        layout: {
          padding: {
            left: 15,
            right: 50
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
          const x = meta.data[0].x + barWidth / 2 + 30;

          ctx.fillStyle = '#333';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'left';

          // Calculate positions based on data percentages with better spacing
          const total = chartArea.height;
          const belowHeight = (this.clinicData.timeInRange.belowRange / 100) * total;
          const inRangeHeight = (this.clinicData.timeInRange.inRange / 100) * total;
          const aboveHeight = (this.clinicData.timeInRange.aboveRange / 100) * total;

          // Position labels for each segment from bottom to top with improved spacing
          ctx.fillText('2%', x, chartArea.bottom - belowHeight / 2);
          ctx.fillText('82%', x, chartArea.bottom - belowHeight - inRangeHeight / 2);

          // Add more space between 15% and 1% labels in correct order (1% top, 15% below)
          ctx.fillText('1%', x, chartArea.top + 15); // 1% at the very top
          ctx.fillText('15%', x, chartArea.bottom - belowHeight - inRangeHeight - aboveHeight * 0.3); // 15% below 1%
        }
      }]
    };

    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  private createHorizontalScaleChart() {
    const ctx = document.getElementById('timeInRangeHorizontalScale') as HTMLCanvasElement;
    if (!ctx) return;

    // Create a more accurate glucose range visualization
    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: [''],
        datasets: [
          {
            label: 'Very Low (40-54)',
            data: [14], // Width proportion for 40-54 range
            backgroundColor: '#d32f2f',
            borderWidth: 0,
            barPercentage: 1.0,
            categoryPercentage: 1.0
          },
          {
            label: 'Low (54-70)',
            data: [16], // Width proportion for 54-70 range
            backgroundColor: '#f44336',
            borderWidth: 0,
            barPercentage: 1.0,
            categoryPercentage: 1.0
          },
          {
            label: 'Target Range (70-180)',
            data: [110], // Largest segment for target range
            backgroundColor: '#4caf50',
            borderWidth: 0,
            barPercentage: 1.0,
            categoryPercentage: 1.0
          },
          {
            label: 'High (180-240)',
            data: [60], // Width proportion for 180-240 range
            backgroundColor: '#ff9800',
            borderWidth: 0,
            barPercentage: 1.0,
            categoryPercentage: 1.0
          },
          {
            label: 'Very High (240-400)',
            data: [160], // Width proportion for 240-400 range
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
            max: 360,
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
          padding: { top: 25, bottom: 8, left: 0, right: 0 }
        }
      } as any,
      plugins: [{
        id: 'scaleLabels',
        afterDraw: (chart: any) => {
          const ctx = chart.ctx;
          const chartArea = chart.chartArea;
          ctx.fillStyle = '#666';
          ctx.font = '11px Arial';
          ctx.textAlign = 'center';

          // Calculate precise positions based on glucose ranges
          const totalWidth = chartArea.right - chartArea.left;
          const ranges = [
            { value: 40, position: 0 },
            { value: 54, position: 14/360 },
            { value: 70, position: 30/360 },
            { value: 180, position: 140/360 },
            { value: 240, position: 200/360 },
            { value: 400, position: 1 }
          ];

          ranges.forEach(range => {
            const x = chartArea.left + (totalWidth * range.position);
            ctx.fillText(range.value.toString(), x, chartArea.top - 8);
          });

          // Add vertical divider lines for even bars (54, 180, 400)
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;

          const dividerLines = [
            { position: 14/360 }, // After 40-54 (even bar 1)
            { position: 140/360 }, // After 70-180 (even bar 3)
            { position: 1 } // After 240-400 (even bar 5)
          ];

          dividerLines.forEach(line => {
            const x = chartArea.left + (totalWidth * line.position);
            ctx.beginPath();
            ctx.moveTo(x, chartArea.top);
            ctx.lineTo(x, chartArea.bottom);
            ctx.stroke();
          });

          // Add "mg/dL" label
          ctx.font = '10px Arial';
          ctx.fillStyle = '#999';
          ctx.textAlign = 'center';
          ctx.fillText('mg/dL', chartArea.left + totalWidth / 2, chartArea.top - 25);
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
            left: 30,
            right: 30,
            top: 15,
            bottom: 15
          }
        }
      } as any,
      plugins: [{
        id: 'customLabels',
        afterDraw: (chart: any) => {
          const ctx = chart.ctx;
          const centerX = chart.width / 2;
          const centerY = chart.height / 2;
          const radius = 60; // Reduced radius for smaller chart
          const outerRadius = 100; // Adjusted for smaller chart

          // Get data values
          const data = chart.data.datasets[0].data;
          const total = data.reduce((a: number, b: number) => a + b, 0);

          // Calculate angles for each segment
          let currentAngle = -Math.PI / 2 + (150 * Math.PI / 180); // Start from rotation offset

          const segments = [
            { value: data[0], label: data[0] + '%', color: '#8bc34a' },
            { value: data[1], label: data[1] + '%', color: '#ffc107' },
            { value: data[2], label: data[2] + '%', color: '#f44336' }
          ];

          segments.forEach((segment, index) => {
            const segmentAngle = (segment.value / total) * 2 * Math.PI;
            const labelAngle = currentAngle + segmentAngle / 2;

            // Calculate positions
            const innerX = centerX + Math.cos(labelAngle) * radius;
            const innerY = centerY + Math.sin(labelAngle) * radius;

            // Adjust label position for smaller chart with proper spacing
            let labelX = centerX;
            let labelY = centerY;

            // Position labels well outside the pie chart
            if (index === 0) { // 72% - left side
              labelX = centerX - 140;
              labelY = centerY - 10;
            } else if (index === 1) { // 23% - right side
              labelX = centerX + 130;
              labelY = centerY + 20;
            } else if (index === 2) { // 5% - bottom right
              labelX = centerX + 110;
              labelY = centerY + 90;
            }

            // Draw longer connecting lines with multiple segments
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(innerX, innerY);

            // Create longer, multi-segment lines
            if (index === 0) { // Left side - 72%
              const midX1 = centerX + Math.cos(labelAngle) * (radius + 25);
              const midY1 = centerY + Math.sin(labelAngle) * (radius + 25);
              const midX2 = centerX - 110;
              const midY2 = centerY - 10;
              ctx.lineTo(midX1, midY1);
              ctx.lineTo(midX2, midY2);
              ctx.lineTo(labelX, labelY - 5);
            } else if (index === 1) { // Right side - 23%
              const midX1 = centerX + Math.cos(labelAngle) * (radius + 30);
              const midY1 = centerY + Math.sin(labelAngle) * (radius + 30);
              const midX2 = centerX + 100;
              const midY2 = centerY + 20;
              ctx.lineTo(midX1, midY1);
              ctx.lineTo(midX2, midY2);
              ctx.lineTo(labelX, labelY - 5);
            } else if (index === 2) { // Bottom right - 5%
              const midX1 = centerX + Math.cos(labelAngle) * (radius + 25);
              const midY1 = centerY + Math.sin(labelAngle) * (radius + 25);
              const midX2 = centerX + 80;
              const midY2 = centerY + 75;
              ctx.lineTo(midX1, midY1);
              ctx.lineTo(midX2, midY2);
              ctx.lineTo(labelX, labelY - 5);
            }

            ctx.lineTo(labelX, labelY - 5);
            ctx.stroke();

            // Draw label background without border (just white background)
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(labelX, labelY - 5, 16, 0, 2 * Math.PI);
            ctx.fill();

            // Draw label text
            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px Arial'; // Slightly smaller font
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(segment.label, labelX, labelY - 5);

            currentAngle += segmentAngle;
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
