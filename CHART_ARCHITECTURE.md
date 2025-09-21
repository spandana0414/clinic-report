# Clinic Outcomes Dashboard - Chart Architecture Documentation

## Project Overview
This is an **Angular 19** medical dashboard application that visualizes clinical data using **Chart.js** library. The application displays glucose management indicators and time-in-range metrics for diabetic patients in a clean, professional interface.

## Application Architecture

### Technology Stack
- **Frontend Framework**: Angular 19 (Standalone Components)
- **Charting Library**: Chart.js with all registerables
- **Styling**: Pure CSS with CSS Grid layout
- **TypeScript**: For type safety and interfaces
- **State Management**: Local component state (NgRx removed for simplicity)

### File Structure
```
src/app/
├── app.component.ts      # Main component with chart logic
├── app.component.html    # Template with 2x2 grid layout
├── app.component.css     # Styling and responsive design
└── app.config.ts         # Angular configuration
```

## Chart Design Implementation

### Layout Structure
The dashboard uses a **2x2 CSS Grid** layout:

```css
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  min-height: 600px;
}
```

### Chart Components

#### 1. Left Container: Time in Range (Dual Chart Layout)
**Location**: `app.component.html:36-49`

Contains two separate Chart.js visualizations:

##### A) Vertical Stacked Bar Chart
- **Canvas ID**: `timeInRangeVerticalStacked`
- **Purpose**: Shows glucose range distribution vertically
- **Data**: Below Range (2%), In Range (82%), Above Range (15%), Very High (1%)
- **Colors**: Red (#f44336), Green (#8bc34a), Yellow (#ffc107)

**Key Implementation Features**:
```typescript
// Custom plugin for side labels
plugins: [{
  id: 'customLabels',
  afterDraw: (chart: any) => {
    // Positions percentage labels on the right side of bars
    const x = meta.data[0].x + barWidth / 2 + 20;
    ctx.fillText('2%', x, chartArea.bottom - belowHeight / 2);
    // ... other labels
  }
}]
```

##### B) Horizontal Scale Chart
- **Canvas ID**: `timeInRangeHorizontalScale`
- **Purpose**: Shows glucose measurement scale
- **Design**: Three equal-width colored segments
- **Labels**: 40, 54, 70, 180, 240, 400 mg/dL

**Key Implementation**:
```typescript
// Equal width segments using identical data values
datasets: [
  { label: 'Low', data: [10], backgroundColor: '#f44336' },
  { label: 'Normal', data: [10], backgroundColor: '#8bc34a' },
  { label: 'High', data: [10], backgroundColor: '#ffc107' }
]
```

#### 2. Right Container: GMI Analysis
**Location**: `app.component.html:52-74`

##### A) GMI Pie Chart
- **Canvas ID**: `gmiPieChart`
- **Purpose**: Shows GMI distribution breakdown
- **Data**: ≤7% (72%), 7-8% (23%), ≥8% (5%)
- **Features**: Custom rotation (150°) and external labels with connecting lines

**Custom Label Implementation**:
```typescript
plugins: [{
  id: 'customLabels',
  afterDraw: (chart: any) => {
    // Draws lines from pie segments to external labels
    const labels = [
      { text: '72%', angle: Math.PI, x: centerX - 80, y: centerY - 20 },
      { text: '23%', angle: 0, x: centerX + 80, y: centerY + 10 },
      { text: '5%', angle: Math.PI/2 + 0.3, x: centerX + 20, y: centerY + 80 }
    ];
  }
}]
```

##### B) Horizontal GMI Bar (Static CSS)
- **Purpose**: Visual legend showing GMI ranges
- **Implementation**: Pure CSS with colored segments
- **Colors**: Green (≤7%), Yellow (7-8%), Red (≥8%)

## Advanced Features

### 1. Screenshot Functionality
**Location**: `app.component.ts:64-155`

Implements dual-method screenshot capture:

```typescript
onPrint() {
  this.captureScreenshot();  // Save image to downloads
  window.print();            // Traditional print dialog
}
```

**Primary Method**: html2canvas library
**Fallback Method**: Canvas API with manual content generation
**Output**: PNG file with timestamp naming

### 2. Dynamic Period Selection
**Location**: `app.component.ts:59-62`

```typescript
onPeriodChange(period: number) {
  this.selectedPeriod = period;
  this.clinicData.reportingPeriod = `${period} days`;
}
```

Updates display for 30, 60, or 90-day periods.

### 3. Chart Memory Management
**Location**: `app.component.ts:55-57`

```typescript
ngOnDestroy() {
  this.charts.forEach(chart => chart.destroy());
}
```

Prevents memory leaks by properly destroying Chart.js instances.

## Data Model

### Interface Definition
```typescript
interface ClinicData {
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
```

## Chart.js Configuration Patterns

### Common Options Used
```typescript
options: {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { stacked: true, display: false },
    y: { stacked: true, beginAtZero: true, max: 100 }
  }
}
```

### Custom Plugin Pattern
All charts use custom plugins for precise label positioning:
```typescript
plugins: [{
  id: 'customLabels',
  afterDraw: (chart: any) => {
    const ctx = chart.ctx;
    // Custom drawing logic here
  }
}]
```

## Responsive Design

### CSS Grid Breakpoint
```css
@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;  /* Stack vertically on mobile */
    gap: 20px;
  }
}
```

### Canvas Sizing
```css
#timeInRangeVerticalStacked {
  max-height: 200px !important;
  max-width: 150px !important;
}
```

## Development Workflow

### 1. Setup
```bash
ng serve --port 4201  # Development server
```

### 2. Chart Initialization
- Charts initialize in `ngOnInit()` with 100ms delay
- Each chart method creates and stores Chart.js instance
- Custom plugins handle all label positioning

### 3. State Management
- No external state management (NgRx removed)
- Local component properties for all data
- Direct data binding to chart configurations

## Performance Optimizations

1. **Chart Destruction**: Proper cleanup in `ngOnDestroy()`
2. **Delayed Initialization**: 100ms timeout ensures DOM readiness
3. **Static Configuration**: Pre-defined chart options reduce runtime calculations
4. **Canvas Sizing**: Fixed dimensions prevent layout thrashing

## Interview Talking Points

### Technical Decisions
1. **Why Chart.js over D3**: Better Angular integration, simpler API
2. **Why remove NgRx**: Unnecessary complexity for local dashboard data
3. **Why custom plugins**: Precise control over label positioning
4. **Why CSS Grid**: Clean 2x2 layout with responsive capabilities

### Problem-Solving Examples
1. **Label Overlapping**: Fixed using calculated positioning
2. **Equal Width Segments**: Used identical data values instead of proportional
3. **Screenshot Feature**: Implemented fallback for browser compatibility
4. **Chart Borders**: Added through Chart.js configuration

### Code Quality Features
1. **TypeScript Interfaces**: Strong typing for medical data
2. **Error Handling**: Try-catch blocks for screenshot functionality
3. **Memory Management**: Proper Chart.js instance cleanup
4. **Responsive Design**: Mobile-first CSS approach

This architecture demonstrates modern Angular practices, Chart.js expertise, and attention to medical data visualization requirements.