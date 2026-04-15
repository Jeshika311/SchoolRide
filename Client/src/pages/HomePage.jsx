import PageHeader from '../components/common/PageHeader';
import DashboardOverview from '../features/dashboard/DashboardOverview';

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <PageHeader
        title="Welcome back"
        subtitle="Manage school commute bookings and monitor daily rides."
      />
      <DashboardOverview />
    </div>
  );
}
