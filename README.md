# Family-travel-tracker

A web application that allows families to track and visualize countries they've visited around the world, with personalized profiles for each family member.

### Features
### Multi-User Family Profiles

Create individual profiles for each family member <br />
Easily switch between family members with a tabbed interface <br />
Personalized color themes for each user <br />
Add new family members at any time <br />

### Country Tracking

Add countries you've visited with a simple search
<br /> Interactive world map that visually highlights visited countries
<br /> Each family member's countries are color-coded according to their profile
<br /> Real-time country count to track your travel progress

### Robust Error Handling

Prevents duplicate country entries
<br /> Validates all user inputs
<br /> Provides helpful error messages
<br /> Prevents empty submissions

### Easy to Use Interface

Intuitive, clean design
<br /> Mobile-responsive layout
<br /> Quick switching between family members
<br /> Visual feedback for actions

### Technology Stack

Frontend: HTML, CSS, EJS templating, JavaScript
<br /> Backend: Node.js, Express.js
<br /> Database: PostgreSQL
<br /> Map Visualization: SVG interactive world map

### Database Schema

Users Table: Stores family member profiles with personalized colors
<br /> Visited Countries Table: Tracks which countries each user has visited
<br /> Countries Table: Reference data of all world countries with country codes

### Key Implementation Features

Relational database with foreign key constraints
<br /> RESTful API design
<br /> Server-side validation
<br /> Client-side form validation
<br /> Interactive SVG manipulation

### Usage Guide
### Adding a New Family Member

Click on "Add Family Member" tab
<br /> Enter the name of the family member
<br /> Select a color for the family member's countries
<br /> Click "Add" to create the profile

### Adding Visited Countries

Select the family member from the tabs
<br /> Type the country name in the input field
<br /> Click "Add" to record the visited country
<br /> The world map will update showing the country in the user's color

### Switching Between Family Members

Click on any family member's tab to view their travel map
<br /> Each member's map shows only their visited countries in their chosen color
