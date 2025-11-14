import { CreateIncidentDialog } from '../CreateIncidentDialog';

export default function CreateIncidentDialogExample() {
  return (
    <CreateIncidentDialog 
      onCreateIncident={(incident) => console.log('Incident created:', incident)} 
    />
  );
}
