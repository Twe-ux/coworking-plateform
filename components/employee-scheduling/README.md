# Employee Scheduling System

A comprehensive employee scheduling and planning system for coworking spaces built with React, TypeScript, shadcn/ui, and Tailwind CSS.

## Components

### EmployeeScheduling

The main scheduling component featuring:

- Monthly calendar view with employee shifts
- List view for detailed schedule overview
- Visual shift type indicators (morning, afternoon, evening, night)
- Easy navigation between months
- Mobile-first responsive design

### EmployeeList

Employee management component featuring:

- Grid and list view modes
- Search and filter by role
- Employee statistics and information
- Avatar with role-based color coding
- Contact information display

### ShiftAssignment

Modal component for creating and editing shifts featuring:

- Employee selection with visual indicators
- Shift type presets with time slots
- Custom time selection
- Location assignment
- Shift validation and preview
- Duration calculation

## Features

### Accessibility

- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader friendly
- Focus management
- Color contrast compliance

### Mobile-First Design

- Responsive breakpoints for all screen sizes
- Touch-friendly interactions
- Optimized layouts for mobile devices
- Collapsible navigation and controls

### Visual Design

- Color-coded employees and shift types
- Intuitive iconography
- Clear visual hierarchy
- Consistent spacing and typography
- Modern card-based layout

## Usage

```tsx
import { EmployeeScheduling, EmployeeList, ShiftAssignment } from '@/components/employee-scheduling';

// In your dashboard page
<EmployeeScheduling />
<EmployeeList employees={employees} onEmployeeSelect={handleSelect} />
<ShiftAssignment open={isOpen} onSave={handleSave} employees={employees} />
```

## Hardcoded Data

The system includes sample data for demonstration:

- 6 employees with different roles (Manager, Reception, Security, Maintenance, Cleaning)
- Color-coded roles for easy identification
- Sample shifts across different types and times
- Extended employee information (email, phone, hire date, hours)

## File Structure

```
components/employee-scheduling/
├── EmployeeScheduling.tsx    # Main calendar/schedule view
├── EmployeeList.tsx          # Employee management
├── ShiftAssignment.tsx       # Shift creation/editing modal
├── index.ts                  # Barrel exports
└── README.md                 # This file

app/dashboard/manager/schedule/
└── page.tsx                  # Main schedule page integration
```

## Navigation

Access the employee scheduling system at:
`/dashboard/manager/schedule`

This integrates with the existing manager dashboard and provides a complete solution for employee scheduling and management.
