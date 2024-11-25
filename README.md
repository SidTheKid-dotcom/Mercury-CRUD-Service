# Mercury AIQuest

Welcome to **Mercury AIQuest**, a multi-service application built to demonstrate AI-driven features combined with robust backend services. This project is split into three repositories:

### 🌟 Quick Introduction

https://github.com/user-attachments/assets/de732828-c699-498a-ba4d-d691cf34b42d


https://github.com/user-attachments/assets/9314b8d6-9871-4dd9-87aa-3ef49a8738e9

---

🚀 Check out the **project showcase video**: [https://www.youtube.com/watch?v=l1pXpls1Vro](https://www.youtube.com/watch?v=l1pXpls1Vro)  
📧 Watch the **Mercury Email Service walkthrough**: [https://www.youtube.com/watch?v=7l9NQXqjo8g&t=0s](https://www.youtube.com/watch?v=7l9NQXqjo8g&t=0s)

---

## 🗂️ Repositories

The project is organized into the following repositories:

### 1. [Frontend: Mercury_AIQuest](https://github.com/DarkHeart01/Mercury_AIQuest)
The main user interface for Mercury AIQuest. Built with React, this frontend enables users to interact with the backend and AI-driven functionalities seamlessly.

### 2. [Backend: Mercury-CRUD-Service](https://github.com/SidTheKid-dotcom/Mercury-CRUD-Service)
Handles all the core CRUD operations for the application, serving as the backbone for database interactions.

### 3. [Backend: Mercury-Email-Service](https://github.com/SidTheKid-dotcom/Mercury-Email-Service)
A microservice dedicated to email-based functionalities such as notifications and updates.

### 4. [Backend: AI-RAG-Service](https://github.com/SidTheKid-dotcom/AI-RAG-Service)
A microservice dedicated to chunking files, storing in vector DB and refining responses using AI, for provinding the feature to talk with files and repos

---

# Mercury CRUD Service

A scalable and modular backend service designed for efficient Create, Read, Update, and Delete (CRUD) operations. This project leverages modern web technologies to offer RESTful APIs for streamlined data management, optimized for high performance and maintainability.

## Features

- **CI/CD Pipeline**: Automates testing, deployment, and versioning for continuous delivery.
- **Talk to Codebases & Files**: API endpoint to talking with your codebases and files
- **ElasticSearch**: Uses ElasticSearch to manage fuzzy queries
- **RabbitMQ Event Broker**: Uses message broker to produce events to trigger email service
- **CRUD Operations**: Fully implemented for posting queries and answer.
- **Voting and Spam Reports**: Supports voting mechanisms on content, enabling user engagement and prioritization.
- **Optimized Query Controllers**: Ensures efficient database interactions with support for complex queries.
- **CORS Support**: Enables cross-origin resource sharing for flexible frontend-backend integration.
- **Error Handling**: Comprehensive error management for smooth user experiences.

## Getting Started

### Prerequisites

- **Node.js**: Ensure you have Node.js installed on your system.
- **Database**: Set up a compatible database (e.g., PostgreSQL or MySQL) for the service.
- **Environment Variables**: Configure `.env` for database credentials and API keys.

