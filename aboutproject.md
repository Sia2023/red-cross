About the Project
Introduction
This project is a Community Second-Hand Platform developed as part of a university assignment to create a distributed system. The platform enables users to browse and book second-hand items uploaded exclusively by the site owner. It serves as a demonstration of distributed system principles while providing a practical application for community sharing. Key functionalities include user authentication, item management, and a booking system.
Key Features
User Authentication: 
Users can register, log in, and manage their accounts.

Role-based access distinguishes between regular users and the site owner.

Item Management: 
The site owner has exclusive rights to upload, edit, and delete items.

Each item includes details like name, description, price, and status (available, booked, or sold).

Booking System: 
Regular users can browse available items, book them, and cancel bookings if necessary.

Once booked, an item becomes unavailable to other users, showcasing real-time state changes.

Distributed System Architecture
The platform is built using a three-tier architecture, ensuring it qualifies as a distributed system:
Client: 
A frontend built with vanilla JavaScript, HTML, and CSS.

Provides the user interface for interacting with the system.

Server: 
A Django backend that processes requests, enforces business logic, and communicates with the database.

Database: 
SQLite database that stores user data, item details, and booking records.

This structure allows multiple clients to connect over a network. When one client books an item, the database updates the item's status, instantly affecting what other clients see and can do. This interaction is a core feature of distributed systems.
Technologies Used
Backend: Django with Django REST Framework for building APIs.

Frontend: Vanilla JavaScript, HTML, and CSS for a lightweight, responsive interface.

Database: SQLite for simple, file-based data storage that requires no additional setup.

Meeting University Requirements
The project fulfills the university's distributed system requirements in the following ways:
Distributed Architecture: The client-server-database model operates over a network, with separate components handling distinct roles.

Client Interaction: One client's actions impact others. For instance, when a user books an item, the shared database updates, preventing other users from booking the same item. This demonstrates interdependence across clients, a hallmark of distributed systems.

Setup and Deployment
To set up and run the project locally or deploy it to a free hosting platform, please refer to the detailed instructions in the project documentation (link-to-docs). This includes prerequisites, installation steps, and configuration details.

