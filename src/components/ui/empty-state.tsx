import { Inbox } from "lucide-react";
export function EmptyState({ title, description }: { title: string; description: string }) { return <div className="panel flex min-h-48 flex-col items-center justify-center px-6 text-center"><Inbox className="mb-3 h-8 w-8 text-muted" /><h3 className="font-bold">{title}</h3><p className="mt-1 max-w-md text-sm text-muted">{description}</p></div>; }
