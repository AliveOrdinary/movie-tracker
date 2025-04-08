# Admin Module

The Admin Module provides comprehensive administrative functionality for the Movie Tracker application. It includes user management, content moderation, system configuration, performance monitoring, and audit logging.

## Key Features

1. **Dashboard**
   - Comprehensive statistics and analytics for the platform
   - User growth and activity metrics
   - Content creation and engagement stats
   - Moderation queue status

2. **User Management**
   - User listing with advanced filtering and searching
   - User role management (Admin, Moderator, User)
   - User moderation (Ban, Suspend, Warn)
   - User activity monitoring

3. **Content Management**
   - Content moderation workflows (Approve, Reject, Flag)
   - Bulk operations for reviews, lists, and movies
   - Feature management (Mark movies as popular, feature lists)

4. **System Configuration**
   - Centralized configuration management
   - Environment-specific settings
   - Secure storage for sensitive configurations

5. **Audit Logging**
   - Comprehensive logging of all administrative actions
   - Audit trail for security and compliance
   - Detailed history for troubleshooting

6. **System Monitoring**
   - Server health monitoring
   - Database statistics and performance
   - API usage and response time tracking

## Architecture

The Admin Module is built using NestJS with a modular architecture:

- **Entities**: Core data models (AdminAuditLog, SystemConfig)
- **DTOs**: Data transfer objects for input/output
- **Services**: Business logic implementation
- **Resolvers**: GraphQL API endpoints
- **Guards**: Authorization and permission controls

## Database Schema

The module adds two primary tables to the database:

1. **admin_audit_logs**: Tracks all administrative actions
   - Stores action type, admin user, timestamp, and details
   - Links to affected entities (users, content)

2. **system_configs**: Stores application configuration
   - Key-value pairs organized by category
   - Supports different data types and validation

## API Usage

The Admin Module exposes a GraphQL API with the following main query categories:

1. **Dashboard Queries**: Get statistics and analytics
2. **User Management Mutations**: Manage user accounts and roles
3. **Content Management Mutations**: Moderate and manage content
4. **System Configuration Queries/Mutations**: Manage system settings
5. **Audit Logging Queries**: Access administrative action history
6. **System Monitoring Queries**: Check system health and performance

Refer to the [Admin API Examples](./admin-api-examples.md) document for detailed GraphQL query examples.

## Security

The Admin Module implements robust security measures:

1. **Role-Based Access Control**: All admin endpoints require the ADMIN role
2. **Audit Logging**: Every administrative action is logged with the actor, action, timestamp, and IP address
3. **Validation**: Input data is validated using class-validator
4. **Action Limitations**: Critical operations have safeguards to prevent accidental data loss

## Getting Started

To use the Admin Module:

1. Ensure the database migrations have been applied:
   ```
   npm run migration:run
   ```

2. Access the GraphQL playground at `http://localhost:3000/graphql`

3. Use the example queries from the [Admin API Examples](./admin-api-examples.md) document to interact with the admin API

## Configuration

The Admin Module loads default configurations during initialization. You can customize these settings using the System Configuration API or by directly modifying the database.

Key configuration categories:

- **GENERAL**: Application-wide settings
- **CONTENT**: Content-related rules and limits
- **USERS**: User management settings
- **MODERATION**: Moderation workflow configuration
- **PERFORMANCE**: Performance tuning parameters

## Contributing

When contributing to the Admin Module:

1. Follow the established patterns for services, resolvers, and entities
2. Add comprehensive tests for new functionality
3. Update this documentation with any significant changes
4. Ensure audit logging for all administrative actions
