import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3001;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "astronomy",
  password: "bhagya",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

// Placeholder for user data
let users = [];

// This function checks if the current user exists and returns their visited countries
async function checkVisisted() {
  const result = await db.query(
    "SELECT country_code FROM visited_countries JOIN users ON users.id = user_id WHERE user_id = $1;",
    [currentUserId]
  );
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

// Enhanced function to get current user with better error handling
async function getCurrentUser() {
  try {
    // Get all users from the database
    const result = await db.query("SELECT * FROM users");
    users = result.rows;
    
    // No users in the database
    if (users.length === 0) {
      // Create a default user if none exists
      const defaultUser = await db.query(
        "INSERT INTO users (name, color) VALUES('Default User', 'teal') RETURNING *;"
      );
      users = [defaultUser.rows[0]];
      currentUserId = defaultUser.rows[0].id;
      return defaultUser.rows[0];
    }
    
    // Find the current user by ID
    const currentUser = users.find(user => user.id == currentUserId);
    
    // If the current user ID doesn't match any user, use the first available user
    if (!currentUser) {
      currentUserId = users[0].id;
      return users[0];
    }
    
    return currentUser;
  } catch (err) {
    console.error("Error getting current user:", err);
    // Return a default user object in case of database failure
    return { id: 1, name: "Default User", color: "teal" };
  }
}

app.get("/", async (req, res) => {
  try {
    const currentUser = await getCurrentUser();
    const countries = await checkVisisted();
    
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: currentUser.color,
      error: null
    });
  } catch (err) {
    console.error("Error on homepage:", err);
    res.status(500).send("An error occurred. Please try again later.");
  }
});

app.post("/add", async (req, res) => {
  try {
    const input = req.body["country"];
    const currentUser = await getCurrentUser();
    
    // Handle empty input
    if (!input || !input.trim()) {
      const countries = await checkVisisted();
      return res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: currentUser.color,
        error: "Please enter a country name."
      });
    }

    // First check if the country exists in our database
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    // Handle country not found
    if (result.rows.length === 0) {
      const countries = await checkVisisted();
      return res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: currentUser.color,
        error: "Country not found. Please try again."
      });
    }

    const data = result.rows[0];
    const countryCode = data.country_code;
    
    // Check if country is already in the user's list
    const existingCountry = await db.query(
      "SELECT * FROM visited_countries WHERE country_code = $1 AND user_id = $2",
      [countryCode, currentUserId]
    );
    
    if (existingCountry.rows.length > 0) {
      const countries = await checkVisisted();
      return res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: currentUser.color,
        error: "You've already added this country!"
      });
    }
    
    // If we get here, the country is valid and not a duplicate, so add it
    await db.query(
      "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
      [countryCode, currentUserId]
    );
    
    res.redirect("/");
  } catch (err) {
    console.error("Database error:", err);
    // Get fresh data to render the page with an error
    const currentUser = await getCurrentUser();
    const countries = await checkVisisted();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: currentUser.color,
      error: "An error occurred. Please try again."
    });
  }
});

app.post("/user", async (req, res) => {
  try {
    if (req.body.add === "new") {
      res.render("new.ejs");
    } else {
      currentUserId = req.body.user;
      // Validate that the user exists before redirecting
      const userExists = await db.query("SELECT * FROM users WHERE id = $1", [currentUserId]);
      
      if (userExists.rows.length === 0) {
        // If user doesn't exist, reset to a valid user
        const allUsers = await db.query("SELECT * FROM users");
        if (allUsers.rows.length > 0) {
          currentUserId = allUsers.rows[0].id;
        }
      }
      
      res.redirect("/");
    }
  } catch (err) {
    console.error("Error switching user:", err);
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  try {
    const name = req.body.name;
    const color = req.body.color;
    
    // Handle empty inputs
    if (!name || !name.trim() || !color) {
      return res.render("new.ejs", {
        error: "Name and color are required."
      });
    }

    // Check if username already exists
    const existingUser = await db.query(
      "SELECT * FROM users WHERE LOWER(name) = LOWER($1)",
      [name.trim()]
    );
    
    if (existingUser.rows.length > 0) {
      return res.render("new.ejs", {
        error: "This name is already taken. Please choose another name."
      });
    }
    
    // Create new user
    const result = await db.query(
      "INSERT INTO users (name, color) VALUES($1, $2) RETURNING *;",
      [name.trim(), color]
    );

    const id = result.rows[0].id;
    currentUserId = id;

    res.redirect("/");
  } catch (err) {
    console.error("Error creating user:", err);
    res.render("new.ejs", {
      error: "An error occurred while creating your profile. Please try again."
    });
  }
});

// Add a database initialization function to ensure required tables exist
async function initializeDatabase() {
  try {
    // Check if users table exists and has at least one user
    const userResult = await db.query("SELECT * FROM users LIMIT 1");
    if (userResult.rows.length === 0) {
      // Create a default user if none exists
      await db.query(
        "INSERT INTO users (name, color) VALUES ('Default User', 'teal') RETURNING *;"
      );
      console.log("Created default user");
    }
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Database initialization error:", err);
    // If there's an error, the tables might not exist yet
    console.log("Tables might need to be created. Please ensure database schema is set up correctly.");
  }
}

// Initialize the database when the server starts
initializeDatabase()
  .then(() => {
    // Only start the server if database initialization is successful
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error("Failed to initialize app:", err);
  });