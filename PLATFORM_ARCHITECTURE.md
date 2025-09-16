# 🚀 Business Outreach Platform Architecture

## Vision
A multi-niche business website platform that enables personalized outreach, tracks engagement, and converts prospects through customized landing pages.

## Core Workflow
1. **Import** businesses from data sources (Outscraper, CSV)
2. **Customize** templates with business-specific content
3. **Send** personalized website links to prospects
4. **Track** engagement and analytics
5. **Convert** interested businesses to customers
6. **Export** hot leads to Go High Level or other CRMs

---

## 📊 Database Architecture

### Core Tables Structure

```sql
-- 1. Business niches (plumbers, HVAC, electricians, etc.)
CREATE TABLE niches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL, -- 'plumbers', 'hvac', 'electricians'
  display_name VARCHAR(100),
  default_template_id INTEGER,
  keywords TEXT[], -- for SEO and content generation
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Universal businesses table (replaces leeds_2_0)
CREATE TABLE businesses (
  id SERIAL PRIMARY KEY,
  niche_id INTEGER REFERENCES niches(id),

  -- Core fields (same as current)
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  phone TEXT,
  email TEXT,
  website TEXT,
  full_address TEXT,
  city TEXT,
  state TEXT,
  rating DECIMAL(2,1),
  reviews INTEGER,

  -- Outreach tracking
  status VARCHAR(50) DEFAULT 'imported', -- imported, customized, sent, viewed, interested, converted
  outreach_date TIMESTAMP,
  last_activity TIMESTAMP,
  notes TEXT,
  priority INTEGER DEFAULT 0, -- 0-10 for sorting your call list

  -- Customization fields
  custom_images JSONB, -- {"hero": "url", "gallery": ["url1", "url2"]}
  custom_content JSONB, -- {"about": "text", "services": ["service1", "service2"]}
  template_overrides JSONB, -- specific template customizations

  -- Analytics
  total_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_time_on_site INTEGER, -- seconds
  last_viewed TIMESTAMP,

  -- Integration fields
  ghl_contact_id TEXT, -- Go High Level ID
  ghl_synced_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Templates table
CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  niche_id INTEGER REFERENCES niches(id),
  type VARCHAR(50), -- 'default', 'premium', 'custom'
  components JSONB, -- template structure and components
  styles JSONB, -- customizable style variables
  preview_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Business template assignments
CREATE TABLE business_templates (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id),
  template_id INTEGER REFERENCES templates(id),
  customizations JSONB, -- business-specific overrides
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Analytics events table
CREATE TABLE analytics (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id),
  event_type VARCHAR(50), -- 'page_view', 'click', 'form_submit', 'call_click'
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  page_path TEXT,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Outreach campaigns
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  niche_id INTEGER REFERENCES niches(id),
  template_id INTEGER REFERENCES templates(id),
  businesses INTEGER[], -- array of business IDs
  status VARCHAR(50) DEFAULT 'draft',
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎨 Template System Architecture

### 1. **Template Components Library**
```typescript
// components/template-builder/
├── sections/
│   ├── HeroSection.tsx      // with variants: image, video, gradient
│   ├── ServicesGrid.tsx     // customizable service cards
│   ├── AboutSection.tsx     // with team, history variants
│   ├── TestimonialsCarousel.tsx
│   ├── ContactForm.tsx      // integrates with your CRM
│   ├── GallerySection.tsx   // before/after, portfolio
│   └── CTABanner.tsx       // call-to-action sections

├── customization/
│   ├── ImageUploader.tsx    // upload/select business images
│   ├── ContentEditor.tsx    // inline editing for text
│   ├── ColorPicker.tsx      // brand colors
│   └── SectionToggler.tsx   // show/hide sections
```

### 2. **Template Builder Interface**
```typescript
// pages/admin/template-builder/[businessId].tsx
- Visual drag-and-drop interface
- Real-time preview
- Quick actions:
  - Upload business photos from Google Street View
  - Generate content with AI
  - Apply template to multiple businesses
  - A/B testing variants
```

### 3. **Dynamic Template Rendering**
```typescript
// pages/[niche]/[slug].tsx
export default function DynamicBusinessPage({ business, template, customizations }) {
  // Merge template + business customizations
  // Track analytics automatically
  // Render components based on template structure
}
```

---

## 📈 Analytics & Tracking System

### 1. **Client-Side Tracking**
```javascript
// lib/analytics.ts
class AnalyticsTracker {
  - Track page views with session ID
  - Monitor time on site
  - Track scroll depth
  - Record CTA clicks
  - Phone number click tracking
  - Form submissions
}
```

### 2. **Analytics Dashboard**
```typescript
// pages/admin/analytics/[businessId].tsx
- Real-time visitor count
- Engagement heatmap
- Conversion funnel
- Best performing templates
- Time-of-day patterns
```

### 3. **Engagement Scoring**
```sql
-- Automatic lead scoring based on behavior
UPDATE businesses
SET priority = CASE
  WHEN total_views > 5 AND avg_time_on_site > 120 THEN 10
  WHEN total_views > 3 AND avg_time_on_site > 60 THEN 7
  WHEN total_views > 1 THEN 5
  ELSE priority
END;
```

---

## 🔄 CRM Integration & Workflow

### 1. **Outreach Flow**
```typescript
// lib/outreach.ts
async function sendPersonalizedSite(businessId: number) {
  1. Generate unique tracking link
  2. Create personalized content
  3. Send via email/SMS
  4. Log in campaign table
  5. Set follow-up reminders
}
```

### 2. **Go High Level Integration**
```typescript
// api/integrations/ghl.ts
- Webhook on high-intent actions (form submit, multiple visits)
- Auto-create contact in GHL
- Tag with engagement level
- Trigger automation sequences
```

### 3. **Call Preparation Interface**
```typescript
// pages/admin/call-queue.tsx
- Priority sorted list
- Business details + engagement history
- Quick notes during call
- One-click to mark status
- Auto-dial integration
```

---

## 🛠 Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [x] Set up Supabase tables
- [ ] Create migration for new schema
- [ ] Build niche management system
- [ ] Create universal business importer

### Phase 2: Template System (Week 2-3)
- [ ] Build component library
- [ ] Create template builder UI
- [ ] Implement customization engine
- [ ] Add image management system

### Phase 3: Analytics (Week 3-4)
- [ ] Implement tracking script
- [ ] Build analytics dashboard
- [ ] Create engagement scoring
- [ ] Add real-time notifications

### Phase 4: Outreach Tools (Week 4-5)
- [ ] Campaign management system
- [ ] Email/SMS integration
- [ ] Call queue interface
- [ ] Follow-up automation

### Phase 5: Integrations (Week 5-6)
- [ ] Go High Level API
- [ ] Twilio for SMS
- [ ] Google Maps API for photos
- [ ] AI content generation

---

## 💡 Advanced Features

### 1. **AI-Powered Customization**
```typescript
// Use OpenAI/Claude API to:
- Generate business descriptions
- Create service lists from reviews
- Extract photos from Google Street View
- Suggest best templates based on business type
```

### 2. **A/B Testing System**
```typescript
// Automatically test:
- Different hero images
- CTA button colors
- Headline variations
- Track which converts better
```

### 3. **Smart Routing**
```typescript
// Subdomain routing for premium feel:
- business.yourplatform.com
- Custom domains via CNAME
- SSL certificates automated
```

### 4. **Mobile App Companion**
```typescript
// React Native app for:
- Quick template edits
- Call queue on-the-go
- Push notifications for hot leads
- Voice notes during calls
```

---

## 🏗 Tech Stack Recommendations

### Current Stack (Keep)
- **Next.js** - Perfect for SEO and performance
- **Supabase** - Excellent for real-time and auth
- **Tailwind** - Fast styling

### Add
- **Resend/SendGrid** - Email delivery
- **Twilio** - SMS and calling
- **Vercel Analytics** - Built-in analytics
- **Uploadthing** - Image management
- **Tiptap** - Rich text editing
- **React Email** - Email templates

### Consider
- **Clerk** - If you need team accounts
- **Posthog** - Advanced analytics
- **Cal.com** - Booking integration
- **Framer Motion** - Animations

---

## 🚦 Quick Start Priority

### Do First (This Week)
1. **Create new database schema** with multi-niche support
2. **Build template component library** (start with 2-3 sections)
3. **Add basic analytics tracking** (page views, time on site)
4. **Create admin dashboard** for managing businesses

### Do Next (Next Week)
1. **Template customization UI**
2. **Engagement tracking dashboard**
3. **Basic outreach workflow**
4. **Import more business types**

### Do Later
1. **CRM integrations**
2. **Advanced analytics**
3. **A/B testing**
4. **Mobile app**

---

## 🎯 Success Metrics

Track these KPIs:
- **Engagement Rate**: Views per sent link
- **Dwell Time**: Average time on site
- **Conversion Rate**: Interested/Total Sent
- **Template Performance**: Which templates get most engagement
- **Best Times**: When businesses engage most
- **ROI**: Revenue per business contacted

---

## 💰 Monetization Paths

1. **Direct Sales**: Convert businesses to marketing services
2. **SaaS Model**: Charge businesses monthly for hosting
3. **Lead Generation**: Sell qualified leads to agencies
4. **White Label**: License platform to other agencies
5. **Data Insights**: Aggregate analytics for market research

---

## 🔒 Security & Compliance

- **Rate limiting** on public pages
- **GDPR compliance** for tracking
- **Data encryption** for business info
- **Audit logs** for all changes
- **Backup strategy** for customizations

---

## Next Immediate Steps

1. **Set up the new database schema**
```bash
npm run db:migrate
```

2. **Create your first template component**
```bash
mkdir -p components/templates
touch components/templates/HeroSection.tsx
```

3. **Build the admin dashboard**
```bash
mkdir -p pages/admin
touch pages/admin/businesses.tsx
```

4. **Start tracking analytics**
```bash
npm install @vercel/analytics
```

This architecture gives you a scalable, professional platform that can grow from your current manual process to a fully automated outreach machine. Start with the basics and add features as you validate what works best for conversion.