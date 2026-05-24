export default function DashboardLoading() {
  return (
    <div className="max-w-7xl animate-pulse">
      <div className="h-8 w-48 bg-slate-200 rounded mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-slate-100 rounded-xl border border-slate-200" />
        ))}
      </div>
      <div className="h-6 w-40 bg-slate-200 rounded mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl border border-slate-200" />
        ))}
      </div>
    </div>
  )
}
