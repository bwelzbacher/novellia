import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { ConfirmDeleteSheet } from "../components/sheets/confirm-delete-sheet/confirm-delete-sheet";

export function confirmDelete(bottomSheet: MatBottomSheet, data: { title: string; message?: string }) {
    return bottomSheet.open(ConfirmDeleteSheet, { data }).afterDismissed();
}