import { type LucideIcon, Clock } from "lucide-react";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function ComingSoon({
  icon: Icon,
  title,
  description = "This feature is coming soon. Stay tuned!",
}: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-primary-50">
        <Icon className="size-10 text-primary-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
      <p className="mt-3 max-w-md text-gray-500">{description}</p>
      <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
        <Clock className="size-4" />
        Coming soon
      </div>
    </div>
  );
}
