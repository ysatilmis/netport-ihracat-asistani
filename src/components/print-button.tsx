'use client'

export function PrintButton({ label = "Yazdır / PDF Kaydet" }: { label?: string }) {
  return (
    <button
      className="btn"
      onClick={() => window.print()}
      style={{
        display: 'inline-block', padding: '10px 20px', background: '#E8560A',
        color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer',
        fontSize: '11pt', fontWeight: 600,
      }}
    >
      {label}
    </button>
  )
}
