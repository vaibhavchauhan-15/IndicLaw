# IndicLaw - Vercel Deployment Guide

This guide provides instructions for deploying the IndicLaw frontend to Vercel.

## Prerequisites

- A Vercel account
- Git repository with your IndicLaw code
- Firebase project configured (already done)

## Deployment Steps

### 1. Connect to Vercel

1. Go to [Vercel](https://vercel.com/) and sign in or create an account
2. Click "Add New..." > "Project"
3. Import your Git repository containing the IndicLaw code
4. Vercel will automatically detect the frontend project

### 2. Configure Project Settings

1. Set the following configuration:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` (if your repository contains both frontend and backend)
   - **Build Command**: `npm run vercel-build` or `npm run build`
   - **Output Directory**: `dist`

### 3. Environment Variables

Add the following environment variables in the Vercel project settings:

```
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-firebase-measurement-id
```

### 4. Deploy Backend API

For the frontend to work properly, you need to deploy the backend API as well. You can:

- Deploy the backend to another platform like Heroku, Render, or Digital Ocean
- Use Vercel Serverless Functions to reimplement some of the backend functionality
- Set up a separate Vercel project for the backend

Once your backend is deployed, add its URL as an environment variable:

```
VITE_API_URL=https://your-backend-api-url.com/api
```

### 5. Deploy

Click "Deploy" in Vercel. Vercel will automatically build and deploy your project.

## Checking Deployment Status

After deployment, Vercel provides:

- Preview URL for each commit
- Production URL for the main branch
- Deploy logs
- Analytics

## Troubleshooting

If you encounter issues with the deployment:

1. Check the build logs in Vercel
2. Ensure environment variables are set correctly
3. Verify your API endpoints are accessible from the frontend
4. Check CORS settings on your backend API
