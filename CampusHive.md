# **CampusHive Backend Notes**

CampusHive is a campus-focused digital platform that connects students with campus-based entrepreneurs and service providers (such as braiders, barbers, photographers, food vendors, and tutors). The platform provides a centralized space for service discovery, provider profiles, and appointment booking.

### Development Guidelines

- **Module System**: CommonJS (`require` / `module.exports`)
- **API Style**: RESTful API
- **Data Format**: JSON
- **Transport**: HTTPS (HTTP in development)
- **Backend Stack**: Node.js with Express
- **Database & ORM**: PostgreSQL with Prisma ORM
- **Authentication**: JWT access + refresh tokens
- **Endpoint Structure**: e.g., `/api/auth/register`, `/api/auth/login`, `/api/services`
- **Naming Conventions**: Plural nouns, lowercase paths, UUID identifiers, no verbs in resource URLs.
- **Database ERD**: [Eraser Workspace ERD](https://app.eraser.io/workspace/y0PevpHKNLGN0quGdecz)
