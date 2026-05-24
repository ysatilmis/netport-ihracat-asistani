export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-slate-700 rounded mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-slate-800 rounded-xl border border-slate-700" />
        ))}
      </div>
      <div className="h-64 bg-slate-800 rounded-xl border border-slate-700" />
    </div>
  )
}
