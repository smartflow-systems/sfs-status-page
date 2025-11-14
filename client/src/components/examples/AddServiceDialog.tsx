import { AddServiceDialog } from '../AddServiceDialog';

export default function AddServiceDialogExample() {
  return (
    <AddServiceDialog onAdd={(service) => console.log('Service added:', service)} />
  );
}
