# Collection Manager App

## Developed by dev2bit - Fran Bohorquez

The Collection Manager App is a web-based tool for managing personal collections, such as books, movies, coins, and more. This Progressive Web Application (PWA) allows for both online and offline functionalities, making it flexible and user-friendly under various connectivity conditions.

### Features

#### Collection Item Types
- **Creation and Management**: Users can create and define custom collection types with specific attributes.
- **Synchronization**: Ability to sync types with a public database for broader access and contribution.
- **Custom Modifications**: Users can modify and publish their own types after a validation process by administrators.

#### Collection Items
- **Detailed Management**: Create items by specifying attributes based on the type.
- **Real-Time Duplication Checks**: Checks against a public database to prevent duplication.
- **Data Segmentation**: Manage items through sections like item data, lists, and publication data.
- **Privacy Control**: Default private creation with options for public sharing after validation.

#### Collection Lists
- **Diverse List Types**: Support for complete collection lists, personal automated/manual lists, and special search or offer lists.
- **Public and Private Options**: Users can set lists as public for sharing or keep them private for personal use.

#### User Engagement
- **Social Features**: Follow other users, see their public profiles and collections.
- **Dynamic Interaction**: Real-time notifications for item matchings in trade or sale scenarios.

### Technical Stack

- **Frontend**: React.js
- **Backend**: Node.js with Express
- **Database**: MongoDB for online, IndexedDB for offline storage
- **Authentication**: Secured via JWT (JSON Web Tokens)
- **Data Sync**: Managed through Service Workers for optimal data flow between local and online databases.

### Development Setup

1. **Installation**
   ```bash
   git clone https://github.com/dev2bit/collection-manager-app.git
   cd collection-manager-app
   npm install
   ```

2. **Running the App**
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

3. **Building for Production**
   ```bash
   npm run build
   ```

4. **Testing**
   ```bash
   npm test
   ```

### Deployment

See the official Create React App [deployment documentation](https://facebook.github.io/create-react-app/docs/deployment) for detailed instructions on deploying to various platforms.

### Further Learning

- [React documentation](https://reactjs.org/)

### Contributions

Contributions are welcomed. Please follow the standard procedures for submitting issues and pull requests.

### License

This project is licensed under the MIT License.

### Contact Information

For inquiries, contact Fran Bohorquez at [info@dev2bit.com](mailto:info@dev2bit.com).