# Design Guidelines: Uptime Monitoring & Status Page

## Design Approach

**Selected System:** Linear + Vercel Status Page Hybrid  
**Rationale:** This utility-focused application demands clarity, efficiency, and trust. Linear's clean productivity patterns combined with Vercel's transparent status page design creates the optimal foundation for real-time monitoring and incident communication.

**Core Principles:**
- Information hierarchy above decoration
- Instant status recognition through clear visual states
- Data density without overwhelming complexity
- Trust through transparency and professional polish

---

## Typography System

**Font Stack:** Inter (primary) via Google Fonts CDN

**Hierarchy:**
- Page Titles: text-3xl font-bold (Dashboard headers, main status page title)
- Section Headers: text-xl font-semibold (Service groups, incident sections)
- Service Names: text-lg font-medium (Individual service listings)
- Metrics/Stats: text-2xl font-bold tabular-nums (Uptime percentages, response times)
- Body Text: text-sm (Incident descriptions, timestamps)
- Labels/Meta: text-xs font-medium uppercase tracking-wide (Status badges, time intervals)
- Status Indicators: text-sm font-semibold (Operational, Degraded, Down)

---

## Layout & Spacing System

**Container Strategy:**
- Dashboard: max-w-7xl mx-auto px-6
- Public Status Page: max-w-5xl mx-auto px-6
- Metric Cards: Consistent card-based layout with p-6

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card gaps: gap-4 to gap-6
- Metric separation: space-x-4

---

## Component Library

### Navigation
- **Dashboard Header:** Full-width with service selector, notifications icon, user avatar (right-aligned)
- **Status Page Header:** Centered logo/title, subscribe button, incident history link
- **Tabs:** Underlined active state for view switching (Overview, Services, Incidents)

### Status Indicators
- **Service Status Cards:** Service name, current status badge, uptime percentage, response time graph (mini sparkline)
- **Status Badges:** Pill-shaped with dot indicator (● Operational, ● Degraded, ● Down)
- **System Status Banner:** Full-width at page top showing overall system health

### Data Display
- **Uptime Grid:** 90-day uptime calendar (small squares showing daily status)
- **Response Time Chart:** Simple line graph with 7-day/30-day toggle
- **Incident Timeline:** Left-aligned timeline with timestamps, status updates, affected services
- **Metrics Dashboard:** Grid layout (grid-cols-3) showing key stats: Total Services, Active Incidents, Average Uptime

### Forms & Inputs
- **Incident Creation:** Modal with service selector, severity dropdown, description textarea
- **Service Configuration:** Form with endpoint URL input, check interval selector, notification settings
- **Subscribe Form:** Email input with "Subscribe to updates" button (status page)

### Interactive Elements
- **Service Cards:** Hover reveals "View details" action, click expands incident history
- **Incident Cards:** Expandable accordion showing full update timeline
- **Quick Actions:** Floating action button (bottom-right) for "Report Incident" on dashboard

---

## Page Structures

### Public Status Page
**Hero Section (40vh):**
- Centered layout with large system status indicator
- Current status message (e.g., "All Systems Operational")
- Last updated timestamp
- Subscribe to updates button

**Services Section:**
- List of all monitored services (stack vertically)
- Each service: Name, status badge, uptime percentage (last 30 days), mini uptime grid
- Group by category if multiple service types exist

**Recent Incidents:**
- 3 most recent incidents with date, title, affected services, resolution status
- "View all incidents" link to full history page

**Uptime Statistics:**
- Grid showing overall system uptime (90 days, 30 days, 7 days)

### Dashboard (Internal)
**Overview Tab:**
- System health summary card
- Active incidents alert banner (if any)
- Service grid (grid-cols-3) with live status, response time graphs
- Quick actions: Add Service, Create Incident

**Services Tab:**
- Filterable list of all services (search + status filter)
- Each row: Service name, endpoint, status, uptime, last checked, actions (edit, pause)

**Incidents Tab:**
- Incident management interface
- Filter by status (Open, Investigating, Resolved)
- Incident cards with update timeline, affected services, create update action

---

## Images

**Hero Section Image:** NONE - Status pages should prioritize immediate status clarity over decorative imagery. The hero uses a large status indicator icon/illustration instead.

**Service Icons:** Use Heroicons for generic service types (server, globe, database, cloud). Display as small icons (w-5 h-5) next to service names.

**Empty States:** Simple illustration placeholders for "No active incidents" or "No services configured" (use undraw.co style illustrations).

---

## Responsive Behavior

**Desktop (lg):** 3-column service grids, side-by-side metrics, full timeline view  
**Tablet (md):** 2-column grids, stacked metrics, condensed timeline  
**Mobile:** Single column, simplified graphs, drawer navigation for dashboard

---

## Animations

**Minimal Implementation:**
- Status badge pulse animation for "Degraded" or "Down" states (animate-pulse)
- Smooth height transitions for expanding incident details (transition-all duration-200)
- Live data updates: Subtle fade-in for new status checks (fade opacity change)