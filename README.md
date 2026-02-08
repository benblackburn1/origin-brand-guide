# Brand Hub

A full-stack web application for managing and distributing brand assets. Built with Node.js/Express, MongoDB, React, and Google Cloud Storage.

## Features

### For Users
- **Brand Guidelines**: Access logos, colors, typography, and brand documentation
- **Templates**: Download presentation templates, social media assets, and more
- **Brand Tools**: Use interactive tools to create on-brand content
- **Preview System**: Enlarge images, view videos/GIFs, navigate multi-page documents
- **Download Options**: Download assets in multiple file formats (PNG, SVG, JPG, EPS, PDF, OTF, TTF, WOFF)

### For Admins
- **Asset Management**: Upload, edit, reorder, and delete brand assets
- **Template Management**: Add templates with preview images/videos and external links (Figma, Google Slides)
- **Tool Creator**: Build custom brand tools with HTML/CSS/JS
- **Color Palette Manager**: Define colors with HEX, RGB, CMYK, and Pantone values
- **Content Editor**: Write brand voice, messaging, and strategy content in Markdown
- **User Management**: Create and manage user accounts with role-based access

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: MongoDB with Mongoose
- **File Storage**: Google Cloud Storage
- **Frontend**: React with Tailwind CSS
- **Authentication**: JWT (JSON Web Tokens)

## Prerequisites

- Node.js 18+
- MongoDB (local or cloud instance like MongoDB Atlas)
- Google Cloud Platform account with a storage bucket (optional for development)

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd brand-hub

# Install all dependencies
npm run install:all
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example server/.env

# Edit the configuration
nano server/.env
```

Update the following values in `server/.env`:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/brand-hub
JWT_SECRET=your-super-secret-key-change-this

# Optional (for Google Cloud Storage)
GCS_PROJECT_ID=your-gcp-project-id
GCS_BUCKET_NAME=your-gcs-bucket-name
GCS_KEY_FILE=./path/to/service-account-key.json
```

### 3. Create First Admin User

```bash
npm run setup
```

Follow the prompts to create your admin account.

### 4. Start Development Server

```bash
npm run dev
```

This starts both the backend (port 5000) and frontend (port 3000).

Open http://localhost:3000 in your browser.

## Google Cloud Storage Setup

### Creating a GCS Bucket

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Navigate to **Cloud Storage** > **Buckets**
4. Click **Create Bucket**
5. Choose a unique name and configure settings:
   - Location: Choose based on your users' location
   - Storage class: Standard
   - Access control: Fine-grained (recommended)
6. Create the bucket

### Creating Service Account Credentials

1. Go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Name it (e.g., "brand-hub-storage")
4. Grant the role: **Storage Object Admin**
5. Click **Done**
6. Click on the service account > **Keys** tab
7. **Add Key** > **Create new key** > **JSON**
8. Save the downloaded JSON file securely

### Configuring the Application

Option 1: Using a key file (recommended for development)
```env
GCS_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=your-bucket-name
GCS_KEY_FILE=./service-account-key.json
```

Option 2: Using JSON credentials (for deployment)
```env
GCS_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=your-bucket-name
GCS_CREDENTIALS={"type":"service_account","project_id":"..."}
```

### CORS Configuration

If you encounter CORS issues, configure your bucket:

```bash
# Create cors.json
echo '[{"origin": ["http://localhost:3000", "https://yourdomain.com"],"method": ["GET"],"responseHeader": ["Content-Type"],"maxAgeSeconds": 3600}]' > cors.json

# Apply to bucket
gsutil cors set cors.json gs://your-bucket-name
```

## Project Structure

```
brand-hub/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context (auth)
│   │   ├── pages/          # Page components
│   │   │   └── admin/      # Admin panel pages
│   │   ├── utils/          # Utilities (API client)
│   │   └── index.css       # Tailwind styles
│   └── package.json
├── server/                 # Express backend
│   ├── config/             # Database & storage config
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Auth & upload middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── utils/              # Utilities (image processing)
│   └── index.js            # Server entry point
├── scripts/                # Setup scripts
├── .env.example            # Environment template
└── package.json            # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Assets
- `GET /api/assets` - Get all assets
- `GET /api/assets/grouped` - Get assets grouped by section/category
- `POST /api/assets` - Create asset (admin)
- `PUT /api/assets/:id` - Update asset (admin)
- `DELETE /api/assets/:id` - Delete asset (admin)
- `GET /api/assets/:id/download/:fileIndex` - Get download URL

### Templates
- `GET /api/templates` - Get all templates
- `GET /api/templates/tags` - Get all tags
- `POST /api/templates` - Create template (admin)
- `PUT /api/templates/:id` - Update template (admin)
- `DELETE /api/templates/:id` - Delete template (admin)

### Tools
- `GET /api/tools` - Get all tools
- `GET /tools/:slug` - View tool page (HTML)
- `POST /api/tools` - Create tool (admin)
- `PUT /api/tools/:id` - Update tool (admin)
- `DELETE /api/tools/:id` - Delete tool (admin)

### Colors
- `GET /api/colors` - Get all color palettes
- `POST /api/colors` - Create/update palette (admin)
- `POST /api/colors/:category/color` - Add color (admin)
- `PUT /api/colors/:category/color/:colorId` - Update color (admin)
- `DELETE /api/colors/:category/color/:colorId` - Delete color (admin)

### Content
- `GET /api/content` - Get all content sections
- `POST /api/content` - Create/update section (admin)
- `PUT /api/content/:section` - Update section (admin)

### Users
- `GET /api/users` - Get all users (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

## Creating Brand Tools

Brand tools are self-contained HTML/CSS/JS applications that run in isolation. To create a new tool:

1. Go to **Admin Panel** > **Tools** > **Create Tool**
2. Enter a title and description
3. Write your HTML, CSS, and JavaScript code
4. Click "Load Example" to see a working Image Overlay Generator
5. Preview and publish your tool

Example tool structure:
```html
<!-- HTML -->
<div class="my-tool">
  <input type="text" id="input">
  <button id="generate">Generate</button>
  <div id="output"></div>
</div>
```

```css
/* CSS */
.my-tool { padding: 2rem; }
#output { margin-top: 1rem; }
```

```javascript
// JavaScript
document.getElementById('generate').addEventListener('click', () => {
  const input = document.getElementById('input').value;
  document.getElementById('output').textContent = `Generated: ${input}`;
});
```

## Production Deployment

### Building for Production

```bash
# Build the React app
npm run build

# Start production server
npm start
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/brand-hub
JWT_SECRET=very-long-random-secret-key
CLIENT_URL=https://yourdomain.com
GCS_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=your-bucket-name
GCS_CREDENTIALS={"type":"service_account",...}
```

### Deployment Options

- **Railway/Render**: Connect your repo and add environment variables
- **Google Cloud Run**: Containerize with Docker
- **AWS/Azure**: Deploy to EC2/App Service
- **Vercel**: Deploy frontend, use separate backend hosting

## Development Without GCS

The application works without Google Cloud Storage configured. Files can be stored locally during development:

1. Leave GCS variables empty in `.env`
2. Assets will be stored in `server/uploads/`
3. Direct URLs will be used instead of signed URLs

## Security Considerations

- Change `JWT_SECRET` in production
- Use HTTPS in production
- Configure CORS properly for your domain
- Use environment variables for all secrets
- Consider IP allowlisting for admin access
- Regularly rotate service account keys

## License

MIT

## Support

For issues and feature requests, please open a GitHub issue.
