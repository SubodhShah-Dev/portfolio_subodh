import AdminPageShell from "../../components/admin/AdminPageShell";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { AsyncContent } from "../../components/ui/AsyncContent";
import { useAsync } from "../../hooks/useAsync";
import { useMutation } from "../../hooks/useMutation";
import type { ContactMessage } from "../../types/message";
import {
  deleteMessage,
  getMessages,
  markMessageRead,
} from "../../services/messageService";
import { useState } from "react";

function formatDate(timestamp: ContactMessage["createdAt"]): string {
  try {
    return timestamp.toDate().toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function ManageMessages() {
  const messages = useAsync<ContactMessage[]>(getMessages, [], {
    isEmpty: (items) => items.length === 0,
  });
  const [pendingDelete, setPendingDelete] = useState<ContactMessage | null>(null);
  const action = useMutation<() => Promise<void>, void>((run) => run());

  const unread = (messages.data ?? []).filter((message) => !message.read).length;

  const toggleRead = (message: ContactMessage) => {
    void action
      .execute(() => markMessageRead(message.id, !message.read))
      .then((result) => {
        if (result.ok) messages.reload();
      });
  };

  return (
    <AdminPageShell
      title="Messages"
      description="Messages sent through the public contact form. Only you can read them."
      actions={
        unread > 0 ? <Badge tone="amber">{unread} unread</Badge> : undefined
      }
    >
      {action.error !== null && (
        <div className="mb-4">
          <Alert tone="error" onDismiss={action.reset}>
            {action.error.message}
          </Alert>
        </div>
      )}

      <AsyncContent
        state={messages}
        empty={
          <EmptyState
            title="No messages yet"
            description="Messages from the public contact form will appear here."
          />
        }
      >
        {(items) => (
          <ul className="space-y-3">
            {items.map((message) => (
              <li key={message.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-100">{message.name}</p>
                      {!message.read && <Badge tone="amber">unread</Badge>}
                    </div>
                    <p className="mt-0.5 break-all text-sm text-slate-500">
                      {message.email}
                      {formatDate(message.createdAt) !== "" && (
                        <span aria-hidden="true"> · </span>
                      )}
                      <time>{formatDate(message.createdAt)}</time>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      disabled={action.status === "submitting"}
                      onClick={() => toggleRead(message)}
                    >
                      {message.read ? "Mark unread" : "Mark read"}
                    </Button>
                    <Button
                      variant="danger"
                      disabled={action.status === "submitting"}
                      onClick={() => setPendingDelete(message)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line break-words border-t border-slate-800 pt-3 text-sm leading-6 text-slate-300">
                  {message.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </AsyncContent>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this message?"
        description="The message is permanently removed. This cannot be undone."
        confirmLabel="Delete"
        destructive
        busy={action.status === "submitting"}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const message = pendingDelete;
          if (message === null) return;
          void action
            .execute(() => deleteMessage(message.id))
            .then((result) => {
              if (result.ok) messages.reload();
              setPendingDelete(null);
            });
        }}
      />
    </AdminPageShell>
  );
}
