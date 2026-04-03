#  Flight Booking Tracker

A full-stack MERN application designed to help users efficiently manage and track their flight bookings.

##  Live Application
* **Public URL:** http://ec2-15-135-202-54.ap-southeast-2.compute.amazonaws.com
* **Test Email:** admin@admin.com
* **Test Password:** admin

##  Features
* **Flight Management (CRUD):** Users can add, view, edit, and cancel their flight bookings in real-time.
* **Data Validation:** Enforces a specific flight number format (e.g., QF123) on both the React frontend and MongoDB backend.
* **Automated CI/CD:** Fully functional deployment pipeline using GitHub Actions to push code directly to an AWS server.

##  Tech Stack
* **Frontend:** React.js
* **Backend:** Node.js, Express.js
* **Database:** MongoDB
* **Deployment:** AWS EC2, PM2, Nginx, GitHub Actions (Self-Hosted Runner)

##  Project Setup Instructions (Running Locally)
Create a `.env` file inside the `backend` directory and add the following variables:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
PORT=5001
```
 On root folder
```
npm run install-all
```
To run
```
npm run
```
Or
```
npm run dev
```
