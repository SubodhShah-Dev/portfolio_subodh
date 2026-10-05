import type { AppError, ContentStatus, MutationStatus } from "../types/common";
import { useAsync } from "./useAsync";
import { useMutation, type MutationResult } from "./useMutation";

/**
 * Service contract every listable admin collection satisfies (§11, §49).
 * Pages pass the six service functions of their collection — the hook owns
 * all shared state (loading, mutations, errors) so pages only render fields.
 */
export interface CollectionAdapter<T, Input> {
  getAll: () => Promise<T[]>;
  create: (input: Input) => Promise<string>;
  update: (id: string, input: Partial<Input>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setStatus: (id: string, status: ContentStatus) => Promise<void>;
  reorder: (ids: string[]) => Promise<void>;
}

export interface OrderedCollection<T, Input> {
  list: ReturnType<typeof useAsync<T[]>>;
  /** Save/create mutation — surface `.error` inside the entity form. */
  save: (id: string | null, input: Input) => Promise<MutationResult<void>>;
  saveState: { status: MutationStatus; error: AppError | null; reset: () => void };
  /** Status/delete/reorder errors — surface as an alert above the list. */
  actionError: AppError | null;
  actionBusy: boolean;
  clearActionError: () => void;
  changeStatus: (item: T, status: ContentStatus) => Promise<void>;
  remove: (item: T) => Promise<void>;
  /** Swaps `index` with its neighbor and persists the new id sequence. */
  move: (ids: string[], index: number, direction: -1 | 1) => Promise<void>;
}

export function useOrderedCollection<T extends { id: string }, Input>(
  adapter: CollectionAdapter<T, Input>,
): OrderedCollection<T, Input> {
  const list = useAsync<T[]>(adapter.getAll, [], {
    isEmpty: (items) => items.length === 0,
  });

  const saveMutation = useMutation<{ id: string | null; input: Input }, void>(
    ({ id, input }) =>
      id === null
        ? adapter.create(input).then(() => undefined)
        : adapter.update(id, input),
  );

  const actionMutation = useMutation<() => Promise<void>, void>((action) => action());

  const reloadIfOk = (result: MutationResult<void>): MutationResult<void> => {
    if (result.ok) list.reload();
    return result;
  };

  const save = async (id: string | null, input: Input) =>
    reloadIfOk(await saveMutation.execute({ id, input }));

  const changeStatus = async (item: T, status: ContentStatus) => {
    await actionMutation.execute(() => adapter.setStatus(item.id, status)).then(reloadIfOk);
  };

  const remove = async (item: T) => {
    await actionMutation.execute(() => adapter.remove(item.id)).then(reloadIfOk);
  };

  const move = async (ids: string[], index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    [next[index], next[target]] = [next[target], next[index]];
    await actionMutation.execute(() => adapter.reorder(next)).then(reloadIfOk);
  };

  return {
    list,
    save,
    saveState: {
      status: saveMutation.status,
      error: saveMutation.error,
      reset: saveMutation.reset,
    },
    actionError: actionMutation.error,
    actionBusy: actionMutation.status === "submitting",
    clearActionError: actionMutation.reset,
    changeStatus,
    remove,
    move,
  };
}
