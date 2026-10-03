"use client";

import { useRouter } from "next/navigation";
import { errorMessage, useToast } from "@/components/admin/feedback/AdminFeedback";
import { ConfirmDialog } from "@/components/admin/feedback/ConfirmDialog";
import { Fragment, useState } from "react";
import type { ZodError } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/Table";
import {
  createPackOption,
  createSizeOption,
  deletePackOption,
  deleteSizeOption,
  updatePackOption,
  updateSizeOption,
} from "@/lib/api/admin/options";
import { packOptionFormSchema, sizeOptionFormSchema } from "@/lib/validation/admin";
import type { PackOption, SizeOption } from "@/types/api";

type Kind = "size" | "pack";
type Option = SizeOption | PackOption;

interface Draft {
  name: string;
  padsPerPack: string;
  sortOrder: string;
}

function draftFrom(option: Option): Draft {
  return {
    name: option.name,
    padsPerPack: "padsPerPack" in option ? String(option.padsPerPack) : "",
    sortOrder: String(option.sortOrder),
  };
}

// Sizes and packs have the same list/add/rename/reorder/delete flow — packs
// just carry an extra pad count.
export function OptionListEditor({ kind, options }: { kind: Kind; options: Option[] }) {
  const router = useRouter();
  const toast = useToast();
  const hasPads = kind === "pack";
  const noun = kind === "size" ? "size" : "pack";
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>({ name: "", padsPerPack: "", sortOrder: "" });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Option | null>(null);

  function startEdit(option: Option | null) {
    setEditingId(option ? option.id : "new");
    setDraft(
      option
        ? draftFrom(option)
        : { name: "", padsPerPack: "", sortOrder: String(options.length) },
    );
    setFieldErrors({});
  }

  function showErrors(error: ZodError) {
    const errors: Partial<Record<keyof Draft, string>> = {};
    for (const issue of error.issues) errors[issue.path[0] as keyof Draft] ??= issue.message;
    setFieldErrors(errors);
  }

  // Returns false when the draft didn't validate (errors are already shown).
  async function persist(id: string | "new"): Promise<boolean> {
    if (kind === "pack") {
      const result = packOptionFormSchema.safeParse(draft);
      if (!result.success) return (showErrors(result.error), false);
      await (id === "new" ? createPackOption(result.data) : updatePackOption(id, result.data));
    } else {
      const result = sizeOptionFormSchema.safeParse(draft);
      if (!result.success) return (showErrors(result.error), false);
      await (id === "new" ? createSizeOption(result.data) : updateSizeOption(id, result.data));
    }
    return true;
  }

  async function handleSave() {
    if (isSubmitting || !editingId) return;
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      if (await persist(editingId)) {
        toast.success(`${kind === "size" ? "Size" : "Pack"} ${editingId === "new" ? "added" : "saved"}`);
        setEditingId(null);
        router.refresh();
      }
    } catch (err) {
      toast.error(errorMessage(err, `Couldn't save the ${noun}.`));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await (kind === "pack" ? deletePackOption : deleteSizeOption)(deleteTarget.id);
    router.refresh();
  }

  const editRow = (
    <Tr>
      <Td>
        <Input
          aria-label={`${noun} name`}
          value={draft.name}
          placeholder={kind === "size" ? "Extra Large" : "Mega Pack"}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <FieldError message={fieldErrors.name} />
      </Td>
      {hasPads ? (
        <Td className="min-w-24">
          <Input
            aria-label="Pads per pack"
            inputMode="numeric"
            value={draft.padsPerPack}
            onChange={(e) => setDraft({ ...draft, padsPerPack: e.target.value })}
          />
          <FieldError message={fieldErrors.padsPerPack} />
        </Td>
      ) : null}
      <Td className="min-w-20">
        <Input
          aria-label="Display order"
          inputMode="numeric"
          value={draft.sortOrder}
          onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })}
        />
        <FieldError message={fieldErrors.sortOrder} />
      </Td>
      <Td colSpan={2}>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
            Cancel
          </Button>
        </div>
      </Td>
    </Tr>
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-heading-3">{kind === "size" ? "Sizes" : "Packs"}</h2>
        <Button size="sm" variant="secondary" onClick={() => startEdit(null)}>
          Add {noun}
        </Button>
      </div>
      {options.length === 0 && editingId !== "new" ? (
        <p className="text-caption">No {noun}s yet. Products need at least one to be sold.</p>
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Name</Th>
              {hasPads ? <Th>Pads</Th> : null}
              <Th>Order</Th>
              <Th>Used by</Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            {options.map((option) =>
              editingId === option.id ? (
                <Fragment key={option.id}>{editRow}</Fragment>
              ) : (
                <Tr key={option.id}>
                  <Td className="font-medium">{option.name}</Td>
                  {hasPads ? <Td>{"padsPerPack" in option ? option.padsPerPack : null}</Td> : null}
                  <Td>{option.sortOrder}</Td>
                  <Td className="text-muted-foreground">
                    {option._count?.variants ?? 0} variant
                    {option._count?.variants === 1 ? "" : "s"}
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(option)}>
                        Edit
                      </Button>
                      {(option._count?.variants ?? 0) === 0 ? (
                        <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(option)}>
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </Td>
                </Tr>
              ),
            )}
            {editingId === "new" ? editRow : null}
          </Tbody>
        </Table>
      )}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={`Delete this ${noun}?`}
        confirmLabel={`Delete ${noun}`}
        pendingLabel="Deleting…"
        successMessage={`${kind === "size" ? "Size" : "Pack"} deleted`}
        onConfirm={handleDelete}
      >
        {deleteTarget ? `"${deleteTarget.name}" will be removed from the list.` : ""}
      </ConfirmDialog>
    </section>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-danger mt-1 text-xs">{message}</p> : null;
}
