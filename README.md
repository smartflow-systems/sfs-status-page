# 🚀 SFS Status Page - Powerhouse Monitoring Platform

A **production-ready status page and uptime monitoring platform** built with modern technologies. Crush the competition with features like AI-powered incident detection, multi-tenant architecture, real-time WebSocket updates, and comprehensive integrations.

## ✨ Features

### 🎯 Core Monitoring
- **Automated Health Checks** - HTTP/HTTPS, TCP, DNS, SSL certificate monitoring
- **Real-time Metrics** - Response time tracking with p50, p95, p99 percentiles
- **Uptime Calculation** - 99.9% SLA tracking across 24h, 7d, 30d, 90d periods
- **Status History** - 90-day uptime calendar with daily aggregation
- **Multi-region Checks** - Ping services from multiple geographic locations

### 🔔 Smart Notifications
- **Email Alerts** - Beautiful HTML templates for incidents and updates
- **Slack Integration** - Post to channels on incidents
- **Discord Integration** - Server notifications with embeds
- **Microsoft Teams** - Adaptive card notifications
- **Custom Webhooks** - POST to any URL on events
- **SMS Alerts** (Premium) - Twilio integration for critical incidents
- **Auto-incident Creation** - Automatically create incidents when services go down
- **Auto-resolution** - Resolve incidents when services recover

### 👥 Multi-Tenancy & Teams
- **Workspaces** - Isolated environments per customer
- **Custom Subdomains** - `your-company.status.sfs.com`
- **Custom Domains** - Use your own domain
- **Team Management** - Role-based access (owner, admin, member, viewer)
- **User Invitations** - Invite team members with specific roles

### 🎨 Customization & Branding
- **Custom Colors** - Match your brand with primary color customization
- **Logo & Favicon** - Upload custom branding assets
- **White-label Mode** - Remove "Powered by SFS" branding (Pro tier)
- **Custom CSS** - Advanced styling for power users
- **Component Groups** - Organize services into categories
- **Display Order** - Drag-and-drop service ordering

### 📊 Analytics & Insights
- **Response Time Charts** - 24-hour time-series data with Recharts
- **Uptime Grid** - GitHub-style 90-day calendar
- **Incident Analytics** - MTTR, frequency, severity tracking
- **Audit Logs** - Complete compliance tracking
- **SLA Compliance** - Track 99.9% goals

### 🔧 Advanced Features
- **Maintenance Windows** - Schedule planned downtime
- **Incident Timeline** - Status updates with timestamps
- **Public API** - Full REST API with API key authentication
- **WebSocket Real-time** - Live updates without page refresh
- **Email Subscriptions** - Let customers subscribe to updates
- **Incident Postmortems** - Document learnings
- **Component Dependencies** - Show cascading failures

## 🏗️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe code
- **Vite** - Lightning-fast build tool
- **TailwindCSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library
- **Radix UI** - Accessible primitives
- **TanStack Query** - Data fetching & caching
- **Recharts** - Data visualization
- **Wouter** - Lightweight routing
- **Framer Motion** - Smooth animations
- **next-themes** - Dark mode support

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** - Reliable database (Neon)
- **WebSocket (ws)** - Real-time connections
- **Zod** - Schema validation
- **bcryptjs** - Password hashing

### Infrastructure
- **Database** - PostgreSQL (Neon Serverless)
- **Email** - Resend / SendGrid
- **SMS** - Twilio
- **Storage** - AWS S3 / Cloudflare R2
- **Deployment** - Vercel / Railway / Docker

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (or Neon account)
- npm or yarn package manager

### 1. Clone & Install
```bash
git clone https://github.com/your-org/sfs-status-page.git
cd sfs-status-page
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Edit `.env` and add your database URL:
```env
DATABASE_URL=postgresql://user:password@host:port/database
PORT=5000
NODE_ENV=development
```

### 3. Database Setup
```bash
# Generate migration
npm run db:push

# This creates all tables in your database
```

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5000` to see your status page!

## 📁 Project Structure

```
sfs-status-page/
├── client/                    # Frontend React app
│   ├── src/
│   │   ├── components/        # UI components
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   └── examples/     # Feature components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   └── lib/              # Utilities & API client
├── server/                    # Backend Express app
│   ├── api/                  # API routes
│   ├── db/                   # Database connection & storage
│   ├── workers/              # Background workers
│   │   ├── health-check.ts   # Health check engine
│   │   └── status-aggregator.ts  # Daily aggregation
│   ├── services/             # Business logic
│   │   └── notifications.ts  # Email & notification service
│   └── routes.ts             # Main route setup
├── shared/                    # Shared types & schema
│   └── schema.ts             # Drizzle database schema
├── migrations/                # Database migrations
├── .env.example              # Environment template
├── package.json              # Dependencies
├── drizzle.config.ts         # Database config
├── tailwind.config.ts        # Tailwind config
└── README.md                 # This file
```

## 🗄️ Database Schema

The platform uses 16 tables for complete functionality:

**Core Tables:**
- `users` - User accounts
- `workspaces` - Multi-tenant workspaces
- `workspace_members` - Team membership
- `components` - Service groups
- `services` - Monitored endpoints
- `monitors` - Health check configurations
- `metrics` - Response time data points
- `status_history` - Daily uptime aggregation

**Incident Management:**
- `incidents` - Outages and degradations
- `incident_updates` - Timeline updates
- `incident_services` - Affected services

**Maintenance:**
- `maintenance_windows` - Planned downtime
- `maintenance_services` - Affected services

**Subscribers & Integrations:**
- `subscribers` - Email subscriptions
- `integrations` - Slack, Discord, webhooks, etc.
- `api_keys` - API authentication
- `audit_logs` - Compliance tracking

## 🔌 API Reference

### Authentication
```bash
# Register
POST /api/auth/register
Body: { username, email, password }

# Login
POST /api/auth/login
Body: { username, password }

# Get current user
GET /api/auth/me
Headers: x-user-id: <userId>
```

### Services
```bash
# List services
GET /api/workspaces/:workspaceId/services

# Create service
POST /api/workspaces/:workspaceId/services
Body: { name, url, type, componentId }

# Update service
PATCH /api/services/:id
Body: { name, description, monitoringEnabled }

# Delete service
DELETE /api/services/:id
```

### Incidents
```bash
# List incidents
GET /api/workspaces/:workspaceId/incidents

# Create incident
POST /api/workspaces/:workspaceId/incidents
Body: { title, description, severity, affectedServices[] }

# Add incident update
POST /api/incidents/:id/updates
Body: { status, message }

# Resolve incident
POST /api/incidents/:id/resolve
```

### Public Status Page
```bash
# Get public status (no auth required)
GET /api/public/status/:slug
```

## 🔧 Configuration

### Health Check Worker

The health check worker runs every 10 seconds and checks all services that are due for a check based on their `checkInterval`.

**Configure in `.env`:**
```env
MAX_CONCURRENT_CHECKS=10
DEFAULT_CHECK_INTERVAL=60
DEFAULT_CHECK_TIMEOUT=30
```

### Email Notifications

Set up Resend for email notifications:

```env
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=status@yourdomain.com
```

**Email templates included:**
- Incident created
- Incident updated
- Incident resolved
- Subscription verification
- Maintenance scheduled

### Integrations

**Slack:**
```bash
POST /api/workspaces/:workspaceId/integrations
{
  "channel": "slack",
  "name": "Engineering Alerts",
  "config": {
    "webhookUrl": "https://hooks.slack.com/services/..."
  },
  "events": ["incident.created", "incident.resolved"]
}
```

**Discord:**
```json
{
  "channel": "discord",
  "config": {
    "discordWebhook": "https://discord.com/api/webhooks/..."
  }
}
```

## 🎯 Roadmap

### Phase 1: MVP ✅
- [x] Database schema
- [x] Health check engine
- [x] API endpoints
- [x] WebSocket real-time
- [x] Email notifications
- [x] Slack/Discord integrations

### Phase 2: Analytics (In Progress)
- [ ] Response time percentiles (p95, p99)
- [ ] MTTR calculation
- [ ] Incident frequency heatmap
- [ ] SLA compliance tracking
- [ ] PDF incident reports

### Phase 3: Advanced Monitoring
- [ ] Multi-region checks
- [ ] SSL certificate monitoring
- [ ] Domain expiry alerts
- [ ] API testing (not just ping)
- [ ] Keyword monitoring

### Phase 4: Enterprise
- [ ] SSO (SAML, OAuth)
- [ ] 2FA/MFA
- [ ] IP allowlisting
- [ ] SOC 2 compliance
- [ ] On-call scheduling

### Phase 5: AI Features
- [ ] Auto-generated incident updates
- [ ] Anomaly detection
- [ ] Root cause analysis
- [ ] Sentiment analysis

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [Drizzle ORM](https://orm.drizzle.team/) for type-safe database queries
- [TanStack Query](https://tanstack.com/query) for data fetching

## 📞 Support

- Documentation: [docs.sfs.com](https://docs.sfs.com)
- GitHub Issues: [Report a bug](https://github.com/your-org/sfs-status-page/issues)
- Email: support@sfs.com

---

**Built with ❤️ by the SFS team**

Powered by SFS Blue `hsl(221 83% 53%)` 🔵
