# StudyBuddy

StudyBuddy is a collaborative web application designed exclusively for UMass students to easily form study groups, share notes, and organize their academic lives. It provides a secure, centralized platform for students to connect and excel together.

## 🚀 Features

- **Secure Authentication**: Robust user authentication powered by Supabase Auth. Requires UMass email verification to ensure a safe and exclusive student community. Includes forgot/reset password flows.
- **Study Groups**: Create, join, and manage study groups for specific classes or topics. Features role-based access control, ensuring group creators cannot leave without transferring ownership, backed by Supabase Row Level Security (RLS).
- **Notes Collaboration**: A dedicated space to share, organize, and access study notes within your peer network.
- **User Profiles**: Manage your personal information, profile details, and preferences.
- **Calendar**: Keep track of upcoming group meetings, exams, and assignment deadlines.

## 🛠️ Technology Stack

- **Frontend**:
  - [React 19](https://react.dev/) - UI Library
  - [Vite](https://vitejs.dev/) - Build Tool & Development Server
  - [React Router 7](https://reactrouter.com/) - Client-side Routing
  - Vanilla CSS - Custom, tailored styling design system
- **Backend**:
  - [Supabase](https://supabase.com/) - Open-source Firebase alternative
  - PostgreSQL Database
  - Supabase Auth (with HTTP-only cookies and RLS policies)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- npm (Node Package Manager)
- A Supabase account and a configured project

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/illUMiNAl004/StudyBuddy
cd StudyBuddy
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Development Server

```bash
npm run dev
```

## 📜 Scripts

- `npm run dev`: Starts the local development server.
- `npm run build`: Bundles the application for production.
- `npm run preview`: Locally previews the production build.
- `npm run lint`: Runs ESLint to check for code quality and style issues.

## 🔒 Security

All data access is secured using Supabase Row Level Security (RLS). Users can only access groups they are part of, and administrative actions are strictly validated at the database level.

## 🤝 Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---
*Built for UMass students, by UMass students.*
