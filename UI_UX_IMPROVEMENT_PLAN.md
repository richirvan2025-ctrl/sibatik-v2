# UI/UX Improvement Plan - SIBATIK

**Tanggal:** 2 Juli 2026
**Skor Saat Ini:** 6.5/10

---

## Skor per Kategori

| Kategori | Skor | Status |
|----------|------|--------|
| Accessibility | 4/10 | ❌ Critical |
| Visual Design | 7/10 | ⚠️ Needs Work |
| Responsive Design | 5/10 | ⚠️ Needs Work |
| Consistency | 6/10 | ⚠️ Needs Work |
| Performance | 7/10 | ✅ Good |
| User Experience | 7/10 | ✅ Good |

---

## Kekuatan

- Komponen modern (shadcn/ui + Tailwind CSS)
- Font system: Plus Jakarta Sans (professional, readable)
- Icon consistency: Lucide icons throughout
- Basic layout: Sidebar + header pattern works well
- Color palette: Clean slate/orange scheme
- Component library: Reusable button, card, badge, input components

---

## Masalah yang Ditemukan

### 1. Accessibility (Critical)
- 47+ hardcoded colors — tidak ada design tokens
- Contrast issues — beberapa teks abu-abu terlalu terang (#94A3B8 = 3.2:1 ratio, gagal WCAG AA)
- Missing focus states — tidak ada visible focus rings
- No ARIA labels — icon-only buttons tanpa label
- No reduced motion support
- No skip links untuk keyboard navigation

### 2. Responsive Design
- Mobile sidebar tidak responsive
- Banyak hardcoded pixel values
- Breakpoints tidak sistematis
- Beberapa touch targets terlalu kecil (<44px)

### 3. Design System
- Semua warna hardcoded di setiap komponen
- Inconsistent spacing (mix 4px, 8px, 12px, 16px tanpa sistem)
- Tidak ada semantic color tokens (primary/secondary/error)
- Typography scale ada tapi tidak konsisten

---

## Roadmap Perbaikan

### Week 1: Accessibility Fix (Priority 1 — Critical)

#### 1.1 Tambah Design Tokens di `globals.css`
```css
:root {
  /* Primary */
  --color-primary: #F97316;
  --color-primary-hover: #EA580C;
  --color-primary-light: #FFF7ED;

  /* Text */
  --color-text: #1E293B;
  --color-text-secondary: #475569;
  --color-text-muted: #64748B;

  /* Surface */
  --color-background: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-border: #E2E8F0;

  /* Status */
  --color-success: #16A34A;
  --color-warning: #EAB308;
  --color-error: #DC2626;
  --color-info: #2563EB;
}
```

#### 1.2 Fix Contrast Issues
```tsx
// Ganti semua:
text-[#94A3B8]  // 3.2:1 ❌
// Menjadi:
text-[#64748B]  // 4.6:1 ✅
```

#### 1.3 Tambah Focus States
```tsx
// Tambahkan ke semua interactive elements:
focus:ring-2 focus:ring-orange-500 focus:outline-none
```

#### 1.4 Tambah ARIA Labels
```tsx
// Icon-only buttons harus punya aria-label:
<button aria-label="Toggle menu" onClick={...}>
  <Menu className="h-5 w-5" />
</button>
```

#### 1.5 Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### Week 2: Design System (Priority 2 — High)

#### 2.1 Update `tailwind.config.ts`
```ts
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: 'var(--color-primary)',
        hover: 'var(--color-primary-hover)',
        light: 'var(--color-primary-light)',
      },
      text: {
        DEFAULT: 'var(--color-text)',
        secondary: 'var(--color-text-secondary)',
        muted: 'var(--color-text-muted)',
      },
      surface: {
        DEFAULT: 'var(--color-surface)',
        background: 'var(--color-background)',
      },
      border: 'var(--color-border)',
      success: 'var(--color-success)',
      warning: 'var(--color-warning)',
      error: 'var(--color-error)',
      info: 'var(--color-info)',
    },
    spacing: {
      // 4pt spacing system
      '0.5': '2px',
      '1': '4px',
      '2': '8px',
      '3': '12px',
      '4': '16px',
      '5': '20px',
      '6': '24px',
      '8': '32px',
      '10': '40px',
      '12': '48px',
    },
  },
}
```

#### 2.2 Replace All Hardcoded Colors
```tsx
// Sebelum:
bg-[#F97316]
text-[#1E293B]
border-[#E2E8F0]

// Sesudah:
bg-primary
text-text
border-border
```

**Files to update:**
- `src/components/layout/sidebar.tsx`
- `src/components/layout/dashboard-shell.tsx`
- `src/components/layout/notification-bell.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/tickets/page.tsx`
- `src/app/(auth)/login/page.tsx`
- Semua page files lainnya

---

### Week 3: Responsive Design (Priority 3 — High)

#### 3.1 Mobile Sidebar
```tsx
const [sidebarOpen, setSidebarOpen] = useState(false);

// Mobile hamburger button di header
<button className="md:hidden" onClick={() => setSidebarOpen(true)}>
  <Menu />
</button>

// Sidebar dengan responsive classes
<aside className={`
  fixed inset-y-0 left-0 z-50 w-64 bg-white
  transform transition-transform duration-300
  ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
  md:translate-x-0 md:static md:z-auto
`}>
```

#### 3.2 Responsive Tables
```tsx
// Mobile: card layout
// Desktop: table layout
<div className="hidden md:block">
  <Table>...</Table>
</div>
<div className="md:hidden space-y-3">
  {tickets.map(ticket => <TicketCard key={ticket.id} {...ticket} />)}
</div>
```

#### 3.3 Touch Target Optimization
```tsx
// Minimum 44x44px untuk semua interactive elements
<button className="min-h-[44px] min-w-[44px] p-2">
```

#### 3.4 Consistent Breakpoints
```
sm:  640px  — small phones
md:  768px  — tablets
lg:  1024px — small laptops
xl:  1280px — desktops
2xl: 1536px — large desktops
```

---

### Week 4: UX Polish (Priority 4 — Medium)

#### 4.1 Loading States
```tsx
import { Skeleton } from "@/components/ui/skeleton";

{isLoading ? (
  <div className="space-y-3">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-32 w-full" />
  </div>
) : (
  <CardContent>...</CardContent>
)}
```

#### 4.2 Empty States
```tsx
{tickets.length === 0 && (
  <Card>
    <CardContent className="flex flex-col items-center py-12">
      <div className="rounded-full bg-slate-100 p-4 mb-4">
        <Ticket className="h-8 w-8 text-slate-400" />
      </div>
      <p className="font-medium text-text">Tidak ada tiket ditemukan</p>
      <p className="text-sm text-text-muted mt-1">
        Coba ubah filter atau buat tiket baru
      </p>
      <Button className="mt-4">Buat Tiket Baru</Button>
    </CardContent>
  </Card>
)}
```

#### 4.3 Form Validation Feedback
```tsx
<Input
  error={errors.email}
  aria-describedby="email-error"
/>
{errors.email && (
  <p id="email-error" role="alert" className="text-error text-sm mt-1">
    {errors.email}
  </p>
)}
```

#### 4.4 Toast/Notification System
```tsx
// Success feedback setelah aksi
toast.success("Tiket berhasil dibuat");
toast.error("Gagal menyimpan perubahan");
```

#### 4.5 Confirmation Dialogs
```tsx
// Sebelum delete/destructive action
<Dialog>
  <DialogTitle>Hapus tiket ini?</DialogTitle>
  <DialogDescription>
    Tindakan ini tidak dapat dibatalkan.
  </DialogDescription>
  <DialogFooter>
    <Button variant="outline">Batal</Button>
    <Button variant="destructive">Hapus</Button>
  </DialogFooter>
</Dialog>
```

---

## Checklist

### Week 1: Accessibility
- [ ] Tambah design tokens di globals.css
- [ ] Fix semua contrast issues (ganti #94A3B8 → #64748B)
- [ ] Tambah focus states ke semua interactive elements
- [ ] Tambah ARIA labels ke icon-only buttons
- [ ] Tambah reduced motion support
- [ ] Tambah skip links

### Week 2: Design System
- [ ] Update tailwind.config.ts dengan semantic colors
- [ ] Replace hardcoded colors di sidebar.tsx
- [ ] Replace hardcoded colors di dashboard-shell.tsx
- [ ] Replace hardcoded colors di notification-bell.tsx
- [ ] Replace hardcoded colors di semua page files
- [ ] Standardize spacing system

### Week 3: Responsive
- [ ] Implement mobile sidebar toggle
- [ ] Responsive tables (card layout di mobile)
- [ ] Optimize touch targets (min 44x44px)
- [ ] Test di 375px, 768px, 1024px, 1440px
- [ ] Fix horizontal scroll issues

### Week 4: UX Polish
- [ ] Tambah skeleton loading states
- [ ] Tambah empty states
- [ ] Improve form validation feedback
- [ ] Tambah toast notifications
- [ ] Tambah confirmation dialogs untuk destructive actions
- [ ] Test keyboard navigation全流程

---

## Catatan

- Build & restart setelah setiap minggu perubahan
- Test di browser: Chrome, Firefox, Safari
- Test di device: iPhone SE (375px), iPad (768px), Desktop (1440px)
- Gunakan Lighthouse untuk audit accessibility score
