export default function PricingLoading() {
  return (
    <div className="max-w-5xl mx-auto animate-pulse">
      <div className="h-8 w-48 bg-slate-200 rounded mb-4 mx-auto" />
      <div className="h-5 w-96 bg-slate-200 rounded mb-12 mx-auto" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-80 bg-slate-100 rounded-2xl border border-slate-200" />
        ))}
      </div>
    </div>
  )
}
