# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.5.4 project called "wikicommonbase" bootstrapped with create-next-app, using React 19.1.0 and TypeScript. The project appears to be the foundation for a Wikipedia-related game application.

## Development Commands

- `npm run dev` - Start development server with Turbopack (opens at http://localhost:3000)
- `npm run build` - Build production bundle with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Project Structure

- **App Router**: Uses Next.js App Router with the `src/app/` directory structure
- **Styling**: Configured with Tailwind CSS v4 and PostCSS
- **Fonts**: Uses Geist and Geist Mono fonts from Google Fonts
- **TypeScript**: Path aliases configured with `@/*` pointing to `./src/*`

## Key Files

- `src/app/page.tsx` - Homepage component
- `src/app/layout.tsx` - Root layout with font configuration and metadata
- `src/app/globals.css` - Global styles with Tailwind CSS
- `next.config.ts` - Next.js configuration (currently minimal)
- `eslint.config.mjs` - ESLint configuration extending Next.js rules
- `tsconfig.json` - TypeScript configuration with strict mode enabled

## Technology Stack

- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4
- **Fonts**: Geist and Geist Mono
- **Build Tool**: Turbopack (enabled for both dev and build)
- **Linting**: ESLint with Next.js TypeScript configuration

## Development Notes

- The project uses Turbopack for both development and build processes for improved performance
- TypeScript is configured with strict mode and ES2017 target
- ESLint is configured to extend Next.js core web vitals and TypeScript rules
- Path aliases are set up for cleaner imports using `@/` prefix