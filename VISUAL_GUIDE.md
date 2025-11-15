# Visual Guide - Datasheet Integration

## Before & After Comparison

### Navigation Bar
**Before:**
```
📊 Dashboard
📁 Templates  
🧪 Datasheet AI Lab [Lab]  ← Visible in sidebar
```

**After:**
```
📊 Dashboard
📁 Templates
(Datasheet AI Lab hidden from nav, but /datasheet-lab route still works)
```

---

## Component Discovery Page Layout

### Component Card - New Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Texas Instruments • LM5145                    [In Stock]    │
│                                                              │
│ High voltage buck-boost controller...                       │
│                                                              │
│ Datasheet: [✓ Parsed (24 pages)]    ← NEW STATUS BADGE     │
│                                                              │
│                    [💬 Open Assistant]  [View URL]  [🗑️]   │
│                           ↑                                  │
│                      NEW BUTTON                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Detail Drawer (Right Side)

```
┌────────────────────────────────────────────────────────┐
│  Texas Instruments                                  [X]│
│  LM5145                                                │
├────────────────────────────────────────────────────────┤
│  [Datasheet] [Details] [Scores]  ← TABS                │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌─────────────────┐  ┌──────────────────────────┐   │
│  │ Upload          │  │ AI Assistant              │   │
│  │ Datasheet       │  │                           │   │
│  │                 │  │ Ask a Question:           │   │
│  │ [Select PDF]    │  │ ┌─────────────────────┐  │   │
│  │                 │  │ │ What is the input   │  │   │
│  │ [Upload & Parse]│  │ │ voltage range?      │  │   │
│  └─────────────────┘  │ └─────────────────────┘  │   │
│                       │                           │   │
│  ┌─────────────────┐  │ Focus Criterion:          │   │
│  │ Status          │  │ [Input Voltage Range ▼]  │   │
│  │                 │  │                           │   │
│  │ ✓ Parsed        │  │ [Ask AI]                  │   │
│  │ 24 pages        │  │                           │   │
│  │ 2 hours ago     │  │ Answer: 4.5V to 65V       │   │
│  └─────────────────┘  │                           │   │
│                       │ 📄 Citations:             │   │
│  ┌─────────────────┐  │ • Page 1: "Operating..."  │   │
│  │ Criteria (4)    │  │ • Page 3: "Maximum..."    │   │
│  │ • Input Voltage │  │                           │   │
│  │ • Efficiency    │  │ 📊 Suggested Rating       │   │
│  │ • Thermal       │  │ Score: 8.5/10             │   │
│  │ • Cost          │  │ [████████░░] 85%          │   │
│  └─────────────────┘  │ Rationale: Wide range...  │   │
│                       └──────────────────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Status Badge Types

### Not Uploaded
```
[⊘ Not uploaded]  ← Gray badge
```

### Parsing in Progress
```
[⟳ Parsing...]  ← Yellow badge with spinner
```

### Successfully Parsed
```
[✓ Parsed (24 pages)]  ← Green badge with checkmark
```

### Parsing Failed
```
[✗ Parsing failed]  ← Red badge
```

---

## User Interaction Flow

### Flow Diagram
```
Component Discovery Page
         │
         ├─ See component list
         │  └─ Each shows datasheet status badge
         │
         ├─ Click "Open Assistant" on any component
         │
         ├─ Drawer slides in from right →
         │  │
         │  ├─ [Datasheet Tab] ← Default
         │  │  ├─ Upload section (left)
         │  │  ├─ Status card (left)
         │  │  ├─ Criteria preview (left)
         │  │  └─ AI Assistant (right, larger)
         │  │
         │  ├─ [Details Tab]
         │  │  └─ Component info
         │  │
         │  └─ [Scores Tab]
         │     └─ Future scoring view
         │
         └─ Close drawer (X or backdrop click)
            └─ Return to component list
```

---

## Datasheet Tab Layout (2-Column)

### Desktop Layout
```
┌──────────────────────────────────────────────────────┐
│ 33% Width              │  67% Width                  │
├────────────────────────┼─────────────────────────────┤
│ Upload Datasheet       │  AI Datasheet Assistant     │
│ • Drag & drop zone     │  • Suggested questions      │
│ • File validation      │  • Question textarea        │
│ • Upload button        │  • Criterion dropdown       │
│                        │  • Ask AI button            │
│ ────────────────────   │  • Answer display           │
│ Datasheet Status       │  • Citations list           │
│ • Parsing state        │  • Suggested rating card    │
│ • Page count           │  • Ask another question     │
│ • Timestamp            │                             │
│ • Error messages       │  (Scrollable)               │
│                        │                             │
│ ────────────────────   │                             │
│ Project Criteria       │                             │
│ • Input Voltage        │                             │
│ • Efficiency           │                             │
│ • Thermal              │                             │
│ • Cost                 │                             │
└────────────────────────┴─────────────────────────────┘
```

### Mobile Layout (Stacked)
```
┌──────────────────────────────────┐
│ Upload Datasheet                 │
│ • Drag & drop                    │
│ • Upload button                  │
├──────────────────────────────────┤
│ Datasheet Status                 │
│ • State & pages                  │
├──────────────────────────────────┤
│ Project Criteria                 │
│ • List of 4 criteria             │
├──────────────────────────────────┤
│ AI Datasheet Assistant           │
│ • Question input                 │
│ • Ask button                     │
│ • Answer display                 │
│ • Citations                      │
│ • Suggested rating               │
└──────────────────────────────────┘
```

---

## Animation Sequence

### Opening Drawer
```
1. User clicks "Open Assistant"
   ├─ Backdrop fades in (0.3s)
   └─ Drawer slides from right (0.3s)

2. Content loads
   ├─ Status card fetches data
   ├─ Criteria load from project
   └─ Assistant panel initializes
```

### Closing Drawer
```
1. User clicks X or backdrop
   ├─ Drawer slides out to right (0.3s)
   └─ Backdrop fades out (0.3s)

2. Returns to component list
   └─ Focus returns to page
```

---

## Color Coding

### Status Colors
- **Gray** (`bg-gray-100`): Not uploaded / Unknown
- **Green** (`bg-green-100`): Successfully parsed
- **Yellow** (`bg-yellow-100`): Parsing in progress
- **Red** (`bg-red-100`): Failed to parse

### Rating Colors
- **Green**: 80-100% (excellent)
- **Yellow**: 60-79% (good)
- **Orange**: 40-59% (fair)
- **Red**: 0-39% (poor)

---

## Keyboard Shortcuts (Future)
```
Esc     - Close drawer
Ctrl+K  - Open search
Tab     - Navigate tabs
Enter   - Submit question
```

---

## Responsive Breakpoints
- **Mobile**: < 768px (single column, stacked)
- **Tablet**: 768px - 1024px (drawer 2/3 width)
- **Desktop**: > 1024px (drawer 1/2 width)
- **Large**: > 1536px (drawer 2/5 width)

---

## Integration Points

### Data Flow
```
ComponentDiscovery.tsx
    │
    ├─ Load components
    ├─ Load datasheet statuses (parallel)
    │  └─ Display badges
    │
    ├─ User clicks "Open Assistant"
    │
    └─ ComponentDetailDrawer.tsx
           │
           └─ DatasheetTab.tsx
                  │
                  ├─ Load project criteria
                  ├─ DatasheetUploadCard
                  ├─ DatasheetStatusCard
                  └─ DatasheetAssistantPanel
                         │
                         ├─ DatasheetCitationsList
                         └─ DatasheetSuggestedRatingCard
```

---

## Testing Checklist Visualized

```
□ Upload PDF
   └─ Status changes to "Parsing..."
      └─ Then "Parsed (X pages)"

□ Ask question
   └─ "Ask AI" button → spinner
      └─ Answer appears with citations

□ Select criterion
   └─ Ask question related to criterion
      └─ Suggested rating card appears

□ Close drawer
   └─ Backdrop click or X button
      └─ Smooth slide-out animation

□ Reopen same component
   └─ Status persists
      └─ Can ask new questions
```

---

## Developer Notes

### Testing URL
```
Production:  /project/{projectId}/discovery
Testing Lab: /datasheet-lab
```

### Component Hierarchy
```
ComponentDiscovery
  └─ ComponentDetailDrawer (conditional)
       └─ DatasheetTab
            ├─ DatasheetUploadCard (reused)
            ├─ DatasheetStatusCard (reused)
            └─ DatasheetAssistantPanel (reused)
                 ├─ DatasheetCitationsList (reused)
                 └─ DatasheetSuggestedRatingCard (reused)
```

---

## Success Indicators

✅ **Visible**:
- Status badges appear inline
- "Open Assistant" button is prominent
- Drawer opens smoothly
- Content is well-organized

✅ **Functional**:
- Upload works
- Status updates in real-time
- Questions return answers
- Citations are clickable
- Ratings are color-coded

✅ **Professional**:
- Matches TradeForm design
- No purple "lab" branding
- Clean typography
- Subtle animations

---

**Visual Style**: Minimal, clean, professional
**Primary Color**: Black/Gray-900
**Accent Colors**: Status-dependent (green/yellow/red)
**Typography**: System fonts, clear hierarchy
**Spacing**: Generous padding, clear sections

