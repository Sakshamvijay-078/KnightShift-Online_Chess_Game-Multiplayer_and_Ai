# KnightShift: Online Chess Game with Multiplayer and AI

KnightShift is a full-stack web application that allows users to play chess online against other players in real-time using WebSockets or challenge a computer opponent powered by the Stockfish engine with adjustable difficulty levels. The application also features a movie discovery platform, enabling users to browse trending and recommended movies, search for specific titles, and view detailed information.

## Features

### Chess Gameplay
- **Online Multiplayer:** Engage in real-time chess matches with other players using WebSocket communication.
- **AI Opponent:** Play against the Stockfish chess engine with selectable difficulty levels.
- **Move Validation:** Ensures all moves adhere to standard chess rules.
- **Responsive UI:** Enjoy a seamless experience across devices with a responsive user interface.

## Tech Stack

### Frontend
- **React.js:** For building the user interface.
- **Axios:** For making HTTP requests to the backend services.
- **React Router:** For handling navigation within the application.

### Backend
- **Backend1 (Chess):**
  - **Node.js** with **TypeScript:** Handles movie data retrieval and chess game logic.
  - **WebSocket (ws):** Manages real-time communication for multiplayer chess games.
  - Compiled to JavaScript using `npx tsc` for production deployment.
  - **Stockfish Integration:** Enables users to play against a computer opponent with adjustable difficulty.

- **Backend2 (Authentication):**
  - **Node.js:** Manages user authentication processes.
  - **JWT (JSON Web Tokens):** Implements secure authentication and session management.

## Installation

To set up the project locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Sakshamvijay-078/KnightShift-Online_Chess_Game-Multiplayer_and_Ai.git
2. **Install the Dependency:**
   by moving in each terminal and run:
   ```bash
   npm install
3. **Run the Servers:**
    1. **Run Frontend**
        ```bash
        cd Frontend
        npm run dev
    2. **Run Backend1**
        ```bash
        cd Backend1
        node .\dist\index.js
    3. **Run Backend2**
       ```bash
        cd Backend2
        node .\index.js
4. **After Changing in Ts files of Backend2**
   ```bash
   cd Backend1
   npx tsc
5. **Set up environment variables:**
   Create a .env file in both Backend1 and Backend2 directories with the necessary configuration. For example:
    ```bash
    PORT=your_port_number
    DATABASE_URL=your_database_url
    JWT_SECRET=your_jwt_secret
    TMDB_API_KEY=your_tmdb_api_key
## Usage
- Access the application: Open your browser and navigate to http://localhost:3000 (or the port your frontend is running on).
- Register/Login: Create an account or log in using your credentials.
- **Play Chess:**
  -  Multiplayer: Invite a friend and start a real-time chess match.
  -  AI Opponent: Select a difficulty level and challenge the computer.
- Discover Movies: Browse trending and recommended movies or search for specific titles to view detailed information.
## Stockfish - engine
For more Detail about Stockfish. Do check out [Link Text](https://stockfishchess.org/)
## Contributing
Contributions are welcome! Please fork the repository and submit a pull request with your enhancements.



