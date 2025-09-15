# Overview

This is a Next.js-based plumbing business website generator that creates templated websites for plumbing companies. The application reads business data from CSV files and generates two different template designs for each plumbing business, allowing them to choose their preferred layout and styling.

The system processes plumbing business data including contact information, location details, ratings, and branding elements (logos and colors) to create personalized websites with dynamic routing based on business slugs.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: Next.js 15 with TypeScript support
- **Styling**: TailwindCSS 4.0 for utility-first CSS styling
- **Rendering Strategy**: Static Site Generation (SSG) with Server-Side Rendering (SSR) for dynamic business pages
- **Routing**: File-based routing with dynamic routes for business templates (`[slug].tsx`)

## Template System
- **Multi-template Design**: Two distinct template designs (Template 1 with gradient backgrounds, Template 2 with professional clean design)
- **Dynamic Theming**: CSS custom properties for primary/secondary color injection based on business branding
- **Responsive Design**: Mobile-first approach using TailwindCSS responsive utilities

## Data Processing
- **CSV Data Source**: Business information stored in CSV format with comprehensive business details
- **Custom CSV Parser**: Built-in CSV parsing with quote handling and escape character support
- **Data Transformation**: Business name to slug conversion, logo URL processing, and color extraction capabilities
- **Business Entity Structure**: Strongly typed interfaces for plumbing business data including contact info, location, ratings, and branding

## Page Architecture
- **Landing Page**: Business template showcase with template previews
- **Dynamic Business Pages**: Template-specific pages with personalized business information
- **SEO Optimization**: Dynamic meta tags and structured data for each business page

## Development Configuration
- **TypeScript**: Full TypeScript support with strict type checking disabled for flexibility
- **ESLint**: Next.js core web vitals configuration for code quality
- **Replit Integration**: Configured for Replit hosting with proper domain and port settings

# External Dependencies

## Core Framework Dependencies
- **Next.js 15.2.3**: React framework for production-grade applications
- **React 19.0.0**: Core React library for UI components
- **TailwindCSS 4.0.15**: Utility-first CSS framework for styling

## Development Tools
- **TypeScript 5.8.2**: Type checking and enhanced developer experience
- **ESLint**: Code linting with Next.js specific rules
- **Node.js Types**: TypeScript definitions for Node.js APIs

## Data Processing (Python Script)
- **pandas**: CSV data manipulation and processing
- **PIL (Python Imaging Library)**: Image processing for logo color extraction
- **scikit-learn**: Machine learning algorithms for color clustering
- **requests**: HTTP client for fetching images from URLs
- **numpy**: Numerical computing for image data processing

The system is designed to be easily deployable on Replit with minimal configuration while providing a scalable foundation for generating multiple business websites from structured data.