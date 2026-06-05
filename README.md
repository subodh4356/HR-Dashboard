# 🚀 HR-Dashboard (Enterprise HRMS Portal)
A high-fidelity, role-based Enterprise Human Resource Management System (HRMS) built with Next.js 16, Tailwind CSS v4, and Supabase.

## 📝 Description
HR-Dashboard is a premium, ultra-responsive corporate workspace environment designed to solve the sluggishness and visual limitations of traditional HRMS platforms. It automates key human resource operations including employee directories, leave management, task assignments, self-appraisals, and a training LMS with digital certification, all within a unified interface.

Built on Next.js 16 (React 19 App Router) and Tailwind CSS v4, the system communicates with a secure Supabase backend. It utilizes database triggers to safely auto-generate notifications on key events, and employs Row-Level Security (RLS) policies to protect employee data at the PostgreSQL schema level while maintaining real-time frontend synchronization.

### 🔐 Supabase Auth & Database Roles
* **Authentication**: Seamlessly managed via Supabase Auth, integrating session persistence and protecting route layouts via Next.js middleware.
* **Database Roles**: User metadata connects to a `user_profile` table that links Supabase Auth IDs to application roles (`admin`, `hr`, `manager`, and `employee`).
* **Admin Portal**: Administrators and HR managers access full metrics charts, edit employee directories, configure performance review cycles, and approve leave requests.
* **Employee Portal**: Employees access self-service check-in/out geotagged attendance, submit leave requests, rate goals, and enroll in LMS training courses.

## 🔋 Features
* **Role-Based Portals** - Restricts and exposes page layouts depending on authenticated profile role (`admin`, `hr`, `manager`, `employee`).
* **Real-Time Automated Notifications** - Instant dispatching driven by secure database triggers on the server, pushed immediately to the client through Supabase Realtime WebSockets.
* **Geotagged Attendance System** - Remote and in-office check-ins tracking coordinates and active status indicators.
* **Performance Reviews** - Interactive manager evaluations, self-appraisals, and target goals tracking sliders.
* **LMS Course Directory & PDF Certs** - Course enrollment catalogue with dynamic progress simulators and exportable PDF certificates on 100% completion.
* **Audit Logging Console** - Live-filterable security operations log with a built-in JSON inspector showing data mutations.

## 📦 Prerequisites
Before installing, ensure you have the following tools set up:
* Node.js (v20.0.0 or higher)
* Supabase Account & Database Instance

## 🛠️ Installation
Follow these sequential steps to set up the development environment locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/hr-dashboard.git
   ```
2. Navigate into the directory:
   ```bash
   cd hr-dashboard
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```

## 💻 Usage
Explain how to execute the application or library once setup is complete:
```bash
# Start the local development server
npm run dev
```


