# Simple Project

This project is a simple web application that consists of a frontend and a backend. The frontend is responsible for user interactions and displays the user interface, while the backend handles requests and communicates with the blockchain.

## Project Structure

```
simple-project
├── frontend
│   ├── index.html       # Main HTML file for the frontend
│   ├── styles.css       # Basic CSS styles for the frontend
│   └── app.js           # Main JavaScript file for the frontend
├── backend
│   ├── server.js        # Entry point for the backend server
│   └── routes.js        # Defines routes for the backend
├── sustainablefishing    # Folder for blockchain-related files
└── README.md            # Documentation for the project
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd simple-project
   ```

2. **Install dependencies:**
   - For the backend, navigate to the `backend` folder and run:
     ```
     npm install
     ```

3. **Run the backend server:**
   ```
   node server.js
   ```

4. **Open the frontend:**
   - Open `frontend/index.html` in a web browser to view the application.

## Overview

This project is designed to be simple and humble, focusing on basic functionality without advanced features. The frontend communicates with the backend to send data to the blockchain, which is managed in the `sustainablefishing` folder.