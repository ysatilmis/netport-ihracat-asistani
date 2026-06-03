# === admin.ts changes ===
with open('src/actions/admin.ts', 'r') as f:
    content = f.read()

# 1. Add updateUserCredits after updateUserLimit
old_func_end = "  revalidatePath('/admin/users')\n  revalidatePath('/dashboard')\n}"

new_func = """  revalidatePath('/admin/users')
  revalidatePath('/dashboard')
}

export async function updateUserCredits(userId: string, credits: number) {
  await requireAdmin()
  const supabase = await createServiceClient()

  const { data: existing } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('user_id', userId)
    .single() as { data: { user_id: string } | null; error: unknown }

  if (existing) {
    await (supabase.from('subscriptions') as any)
      .update({ credits })
      .eq('user_id', userId)
  } else {
    const now = new Date().toISOString().split('T')[0]
    const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    await (supabase.from('subscriptions') as any).insert({
      user_id: userId,
      plan: 'free',
      monthly_limit_tokens: 0,
      current_period_start: now,
      current_period_end: end,
      extra_tokens: 0,
      credits,
    })
  }

  revalidatePath('/admin/users')
  revalidatePath('/dashboard')
}"""

idx = content.rfind(old_func_end)
if idx > 0:
    content = content[:idx] + new_func + content[idx + len(old_func_end):]
    print('updateUserCredits added')
else:
    print('updateUserLimit end NOT FOUND')
    idx = content.rfind("revalidatePath")
    print(content[idx:idx+150])

# 2. Add calcCredits helper
old_calc = "  function calcReportLimit(sub: (SubRow & { extra_tokens: number }) | null | undefined): number {"
content = content.replace(
    old_calc,
    """  function calcCredits(sub: (SubRow & { extra_tokens: number; credits?: number }) | null | undefined): number {
    return sub?.credits ?? 0
  }

  function calcReportLimit(sub: (SubRow & { extra_tokens: number }) | null | undefined): number {"""
)

# 3. Add credits to merged map type
content = content.replace(
    "    reportLimit: number\n    paymentCount: number\n    paymentTotal: number\n  }>()",
    "    reportLimit: number\n    credits: number\n    paymentCount: number\n    paymentTotal: number\n  }>()"
)

# 4. Add credits to both merged.set calls
for old_line in [
    "      reportLimit: calcReportLimit(sub),\n      paymentCount: pmt?.count ?? 0,\n      paymentTotal: pmt?.total ?? 0,\n    })\n  }",
    "        reportLimit: calcReportLimit(sub),\n        paymentCount: pmt?.count ?? 0,\n        paymentTotal: pmt?.total ?? 0,\n      })\n    }\n  }"
]:
    new_line = old_line.replace(
        "reportLimit: calcReportLimit(sub),",
        "reportLimit: calcReportLimit(sub),\n      credits: calcCredits(sub),"
    )
    content = content.replace(old_line, new_line)

with open('src/actions/admin.ts', 'w') as f:
    f.write(content)
print('admin.ts done')
