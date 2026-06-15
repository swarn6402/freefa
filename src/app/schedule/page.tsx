import { ScheduleMatchesFeed } from '@/components/ScheduleMatchesFeed';

export const revalidate = 86400;

export const metadata = {
  title: 'Schedule | FreeFA',
};

export default function SchedulePage() {
  return (
    <div className="min-h-screen bg-black pitch-bg">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-4 sm:px-6 sm:py-6 lg:space-y-10 lg:px-8">
        <div>
          <h1 className="text-2xl font-black text-white md:text-3xl">Schedule</h1>
          <p className="mt-1 text-sm text-zinc-500">104 matches · June 11 - July 19, 2026</p>
        </div>

        <ScheduleMatchesFeed />
      </div>
    </div>
  );
}
