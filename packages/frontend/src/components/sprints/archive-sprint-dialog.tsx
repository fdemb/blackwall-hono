import ArchiveIcon from "lucide-solid/icons/archive";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ArchiveSprintDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
};

export function ArchiveSprintDialog(props: ArchiveSprintDialogProps) {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia class="bg-destructive/50">
            <ArchiveIcon class="size-4" />
          </AlertDialogMedia>
          <AlertDialogTitle>Archive this sprint?</AlertDialogTitle>
          <AlertDialogDescription>
            This hides the sprint from default sprint lists. Only non-done issues are moved to
            backlog; done issues stay linked for history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel size="xs">Cancel</AlertDialogCancel>
          <AlertDialogAction size="xs" variant="destructive" action={props.onConfirm}>
            Archive sprint
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
