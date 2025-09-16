# Business Directory Platform - Project Documentation

## Latest Update: Template Editor System (Template 3)

### Current Status
We've built a professional visual website editor system for customizing business templates. The editor allows real-time editing of business landing pages with auto-save functionality.

### Key Components

#### 1. **Visual Editor** (`/editor/[slug]`)
- Split-screen interface: 60% preview, 40% property panel
- Section-based editing (hover to highlight, click to edit)
- Auto-saves changes after 1 second (debounced)
- Only edits Template 3 (plumbing3) for consistency

#### 2. **Template 3** (`/plumbing3/[slug]`)
- Purpose-built template that matches editor preview exactly
- Reads customizations from `plumbing_templates` table
- Supports dynamic placeholders:
  - `{business_name}` → Actual business name
  - `{city}`, `{state}` → Location data
  - `{phone}` → Phone number
  - `{address}` → Full address

#### 3. **Database Structure**
```sql
plumbing_templates table:
- business_slug (unique identifier)
- template_name (always 'plumbing3' for editor)
- custom_images (JSONB) - hero_image, logo, etc.
- custom_text (JSONB) - headlines, buttons, content
- custom_colors (JSONB) - all color customizations
- is_published (boolean) - publish status
```

### How to Access & Modify Database

#### Using Migration System
```bash
# Create new migration file
echo "ALTER TABLE plumbing_templates ADD COLUMN new_field TEXT;" > scripts/db/010_add_field.sql

# Run migrations
npm run db:migrate

# Check tables (dry run)
npm run db:check
```

#### Direct Supabase Access
1. Go to Supabase Dashboard
2. Use SQL Editor for direct queries
3. All changes persist immediately

### Editor Workflow

1. **Access Editor**: Click ⚙️ in Leeds 2.0 table
2. **Edit Sections**: Click on hero/services/about sections
3. **Properties Panel**: Edit all properties on right side
4. **Auto-Save**: Changes save automatically
5. **View Live**: Opens `/plumbing3/[slug]` with current edits
6. **Publish**: Marks as published for production deployment

### Deployment Strategy

- **Development**: View Live shows Replit/GitHub preview
- **Production**: Publish button prepares for Vercel deployment
- **Each business**: Gets unique URL based on slug

### Button Actions & Dynamic Data

Templates support:
- Call button → `tel:{phone}` from database
- Email → `mailto:{email_1}` from database
- Reviews → Links to `reviews_link` from database
- Dynamic text with placeholders

---

# Business Directory Platform - Project Documentation

## Overview
This is a multi-template business directory platform initially focused on plumbing businesses, with plans to expand to multiple business types. The system generates SEO-optimized, customizable landing pages for individual businesses using data from CSV imports.

## Project Structure

### Core Components

#### Data Management
- **CSV Data Source**: `data/filtered_plumbing_data.csv` - Primary filtered dataset containing business information
- **Mobile Optimized Data**: `data/mobile_filtered_plumbing_data.csv` - Mobile-specific filtered dataset
- **Review Data**: `data/reviews_by_business.json` - Aggregated customer reviews per business

#### Pages & Routes

1. **Main Directory** (`/`)
   - Original plumbing business table view
   - Links to individual business pages

2. **Leeds 2.0** (`/leeds2`)
   - Advanced directory table with:
     - Real-time search filtering
     - City-based filtering
     - Multiple sorting options (rating, reviews, name, city)
     - Statistics dashboard
     - Direct links to multiple template options

3. **Business Templates**
   - **Template 1** (`/plumbing1/[slug]`) - Modern single-page design with hero section
   - **Template 2** (`/plumbing2/[slug]`) - Alternative layout (existing)
   - Dynamic color theming based on business preferences
   - SEO-optimized meta tags
   - Responsive design

#### Libraries & Utilities

- **`lib/csvReader.ts`** - CSV parsing and business data management
- **`lib/csvParser.ts`** - Additional CSV processing utilities
- **`lib/colorUtils.ts`** - Dynamic color scheme generation for brand consistency
- **`components/PlumbingTable.tsx`** - Reusable table component for business listings

## Database Structure

### Business Data Schema
Each business record includes:
- **Basic Info**: name, slug, phone, email
- **Location**: full_address, city, state, country, plus_code
- **Online Presence**: website, facebook, instagram, reviews_link
- **Metrics**: rating (1-5), reviews (count)
- **Branding**: primary_color, secondary_color, logo
- **Operations**: working_hours
- **Additional**: emails (email_1, email_2, email_3)

## Key Features

### Current Implementation
- CSV data import and processing
- Dynamic routing for individual business pages
- Customizable color themes per business
- SEO-optimized pages with meta tags
- Responsive design with Tailwind CSS
- Multiple template options
- Advanced filtering and search (Leeds 2.0)

### Planned Enhancements

#### 1. Multi-Business Type Support
- Expand beyond plumbing to include:
  - HVAC services
  - Electricians
  - General contractors
  - Landscaping
  - Other service industries

#### 2. Template Customization System
- Admin interface for template editing
- Per-business customization options
- Template preview system
- A/B testing capabilities

#### 3. Middleware & Hosting Infrastructure
- Individual domain mapping per business
- SSL certificate management
- CDN integration for assets
- Performance optimization
- Analytics integration

#### 4. Business Management Features
- Business owner dashboard
- Content management system
- Review management
- Lead tracking
- Contact form integration

## Technical Stack

- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS with PostCSS
- **Data Processing**: Custom CSV parsing
- **Deployment**: Ready for Vercel/similar platforms

## Development Workflow

### Running Locally
```bash
npm install
npm run dev
```

### Building for Production
```bash
npm run build
npm run start
```

### Adding New Business Types
1. Create new CSV with appropriate business data
2. Update `lib/csvReader.ts` to handle new business type
3. Create new template pages in `pages/[business-type]/`
4. Add routing logic to Leeds 2.0

### Creating New Templates
1. Design template in `pages/[business-type]/[template-name]/[slug].tsx`
2. Implement dynamic data injection
3. Apply color theming using `colorUtils`
4. Add template option to Leeds 2.0 actions

## API Endpoints
- `/api/` - Directory for future API endpoints
- Planned: Business data API, review submission, contact forms

## Environment Setup
No special environment variables required currently. Future implementations will need:
- Database connection strings
- API keys for third-party services
- CDN configuration
- Analytics tracking IDs

## Deployment Considerations

### Performance
- Static generation where possible
- Server-side rendering for dynamic content
- Image optimization
- Lazy loading for large datasets

### SEO
- Dynamic meta tags
- Structured data markup (planned)
- Sitemap generation (planned)
- Robots.txt configuration

### Scalability
- Database migration path from CSV
- Caching strategy
- CDN implementation
- Load balancing considerations

## Future Architecture

### Microservices Approach
- Business data service
- Template rendering service
- Analytics service
- Review aggregation service

### Database Migration
- Move from CSV to PostgreSQL/MongoDB
- Implement data validation
- Add data versioning
- Create backup strategies

## Monitoring & Analytics
- Page performance metrics
- User engagement tracking
- Conversion tracking
- Error logging and monitoring

## Security Considerations
- Input sanitization for user submissions
- Rate limiting for API endpoints
- CORS configuration
- Data privacy compliance (GDPR, CCPA)

## Contributing
When adding new features:
1. Maintain consistent code style
2. Update this documentation
3. Test across different screen sizes
4. Ensure backwards compatibility
5. Consider performance impact

## Notes for Future Development
- The platform is designed to be white-label ready
- Each business can potentially have multiple templates
- Consider implementing a template marketplace
- Plan for internationalization (i18n)
- Implement progressive web app (PWA) features