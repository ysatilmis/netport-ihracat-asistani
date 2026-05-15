export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-sm border">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Netport AI</h1>
          <p className="text-sm text-slate-500 mt-1">İhracat Asistanı</p>
        </div>
        {children}
      </div>
    </div>
  )
}
