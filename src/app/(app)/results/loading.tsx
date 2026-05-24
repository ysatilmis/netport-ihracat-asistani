export default function ResultsLoading() {
  return (
    <div className="max-w-7xl animate-pulse">
      <div className="h-6 w-32 bg-slate-200 rounded mb-6" />
      <div className="h-10 w-64 bg-slate-200 rounded mb-8" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl border border-slate-200" />
        ))}
      </div>
    </div>
  )
}
