import { useEffect } from "react";

export interface ToastMessage {
  text: string;
  kind?: "info" | "success" | "error";
}

interface Props {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

/** A small auto-dismissing notification, friendlier than browser alert(). */
export default function Toast({ toast, onDismiss }: Props) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const color =
    toast.kind === "error"
      ? "bg-red-600"
      : toast.kind === "success"
        ? "bg-pitch"
        : "bg-slate-800";

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pointer-events-none">
      <div
        className={`${color} text-white text-sm font-semibold rounded-full shadow-lg px-4 py-2 pointer-events-auto cursor-pointer max-w-sm`}
        onClick={onDismiss}
        role="status"
      >
        {toast.text}
      </div>
    </div>
  );
}
