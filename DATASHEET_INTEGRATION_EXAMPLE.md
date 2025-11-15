# DatasheetAssistant Integration Example

This guide shows how to integrate the DatasheetAssistant component into your existing pages.

## Quick Integration Example

Here's how to add a "Datasheet Assistant" button to your component list or detail view:

### Option 1: Add to Component List (e.g., ComponentDiscovery.tsx)

```tsx
import React, { useState } from 'react';
import DatasheetAssistant from '../components/DatasheetAssistant';
import { Component, Criterion } from '../types';

function ComponentDiscoveryPage() {
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const components = []; // your components array
  
  return (
    <div>
      {/* Your existing component table */}
      <table>
        <tbody>
          {components.map((component: Component) => (
            <tr key={component.id}>
              <td>{component.manufacturer}</td>
              <td>{component.partNumber}</td>
              <td>
                {/* Add Datasheet Assistant button */}
                <button
                  onClick={() => setSelectedComponentId(component.id)}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  📄 Datasheet Assistant
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Render DatasheetAssistant as side panel */}
      {selectedComponentId && (
        <DatasheetAssistant
          componentId={selectedComponentId}
          criteria={criteria}
          onClose={() => setSelectedComponentId(null)}
        />
      )}
    </div>
  );
}
```

### Option 2: Add as Action Button with Icon

```tsx
// In your component card or row
<div className="flex gap-2">
  <button
    onClick={() => openDatasheetAssistant(component.id)}
    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    title="Open Datasheet Assistant"
  >
    <svg 
      className="mr-2 h-4 w-4" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
      />
    </svg>
    Datasheet
  </button>
</div>
```

### Option 3: Add to Component Detail View

```tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DatasheetAssistant from '../components/DatasheetAssistant';
import { Component, Criterion } from '../types';
import { componentsApi, criteriaApi } from '../services/api';

function ComponentDetailPage() {
  const { componentId, projectId } = useParams();
  const [component, setComponent] = useState<Component | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [showAssistant, setShowAssistant] = useState(false);
  
  useEffect(() => {
    // Load component and criteria
    if (projectId) {
      criteriaApi.getByProject(projectId).then(res => {
        const transformed = res.data.map((c: any) => ({
          id: c.id,
          projectId: c.project_id,
          name: c.name,
          description: c.description,
          weight: c.weight,
          unit: c.unit,
          higherIsBetter: c.higher_is_better,
          minimumRequirement: c.minimum_requirement,
          maximumRequirement: c.maximum_requirement,
        }));
        setCriteria(transformed);
      });
    }
  }, [projectId]);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Component details */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold">
          {component?.manufacturer} {component?.partNumber}
        </h1>
        
        {/* Datasheet Assistant Button */}
        <button
          onClick={() => setShowAssistant(true)}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg 
            className="-ml-1 mr-2 h-5 w-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
            />
          </svg>
          Open Datasheet Assistant
        </button>
      </div>
      
      {/* DatasheetAssistant Panel */}
      {showAssistant && componentId && (
        <DatasheetAssistant
          componentId={componentId}
          criteria={criteria}
          onClose={() => setShowAssistant(false)}
        />
      )}
    </div>
  );
}

export default ComponentDetailPage;
```

## Key Points

### 1. Props Required

The DatasheetAssistant component requires:
- `componentId` (string): The UUID of the component
- `criteria` (Criterion[]): Array of criteria for the project
- `onClose` (optional function): Callback to close the panel

### 2. Loading Criteria

You need to fetch and transform criteria from the API:

```tsx
const loadCriteria = async (projectId: string) => {
  const response = await criteriaApi.getByProject(projectId);
  
  // Transform snake_case API response to camelCase
  const transformed = response.data.map((c: any) => ({
    id: c.id,
    projectId: c.project_id,
    name: c.name,
    description: c.description,
    weight: c.weight,
    unit: c.unit,
    higherIsBetter: c.higher_is_better,
    minimumRequirement: c.minimum_requirement,
    maximumRequirement: c.maximum_requirement,
  }));
  
  return transformed;
};
```

### 3. State Management

Manage the panel visibility with state:

```tsx
const [showAssistant, setShowAssistant] = useState(false);
const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

// Open for specific component
const openAssistant = (componentId: string) => {
  setSelectedComponentId(componentId);
  setShowAssistant(true);
};

// Close
const closeAssistant = () => {
  setShowAssistant(false);
  setSelectedComponentId(null);
};
```

### 4. Multiple Components

If you have multiple components in a table, use a single assistant instance:

```tsx
{selectedComponentId && (
  <DatasheetAssistant
    componentId={selectedComponentId}
    criteria={criteria}
    onClose={() => setSelectedComponentId(null)}
  />
)}
```

This way, clicking different component buttons will update the same side panel.

### 5. Styling Notes

The DatasheetAssistant is styled as a fixed side panel:
- Takes up full height of viewport
- 1/3 width on large screens, 2/5 on medium, full width on small
- Appears from right side
- Has gradient header and scrollable content
- Includes its own close button

No additional wrapper styling needed!

## Complete Working Example

Here's a minimal complete example you can use as a starting point:

```tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DatasheetAssistant from '../components/DatasheetAssistant';
import { Component, Criterion } from '../types';
import { componentsApi, criteriaApi } from '../services/api';

const ComponentsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [components, setComponents] = useState<Component[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    
    const loadData = async () => {
      try {
        // Load components
        const compResponse = await componentsApi.getByProject(projectId);
        const transformedComponents = compResponse.data.map((c: any) => ({
          id: c.id,
          projectId: c.project_id,
          manufacturer: c.manufacturer,
          partNumber: c.part_number,
          description: c.description,
          datasheetUrl: c.datasheet_url,
          datasheetFilePath: c.datasheet_file_path,
          availability: c.availability,
          source: c.source,
        }));
        setComponents(transformedComponents);
        
        // Load criteria
        const critResponse = await criteriaApi.getByProject(projectId);
        const transformedCriteria = critResponse.data.map((c: any) => ({
          id: c.id,
          projectId: c.project_id,
          name: c.name,
          description: c.description,
          weight: c.weight,
          unit: c.unit,
          higherIsBetter: c.higher_is_better,
          minimumRequirement: c.minimum_requirement,
          maximumRequirement: c.maximum_requirement,
        }));
        setCriteria(transformedCriteria);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [projectId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Components</h1>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Manufacturer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Part Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {components.map((component) => (
              <tr key={component.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {component.manufacturer}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {component.partNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => setSelectedComponentId(component.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    📄 Datasheet Assistant
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* DatasheetAssistant Side Panel */}
      {selectedComponentId && (
        <DatasheetAssistant
          componentId={selectedComponentId}
          criteria={criteria}
          onClose={() => setSelectedComponentId(null)}
        />
      )}
    </div>
  );
};

export default ComponentsPage;
```

## Testing Your Integration

1. **Start Backend**: Make sure your FastAPI backend is running
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Start Frontend**: Run your React app
   ```bash
   cd frontend
   npm start
   ```

3. **Navigate**: Go to a page with components

4. **Click Button**: Click "Datasheet Assistant" for any component

5. **Upload PDF**: Upload a test PDF datasheet

6. **Try Q&A**: Ask questions (will get stub responses until AI is implemented)

## Troubleshooting

### "Cannot find module DatasheetAssistant"
- Make sure the file is in `frontend/src/components/DatasheetAssistant.tsx`
- Check your import path is correct

### "Network Error"
- Verify backend is running on port 8000
- Check CORS settings in `backend/app/main.py`
- Verify `REACT_APP_API_URL` in frontend `.env`

### Types not working
- Make sure you've added the new interfaces to `frontend/src/types/index.ts`
- Restart your TypeScript server if using VS Code

### Panel doesn't close
- Make sure you're passing the `onClose` prop
- Check that state is being updated in the parent component

---

**Need Help?** Check the main implementation guide in `DATASHEET_FEATURE_GUIDE.md`

