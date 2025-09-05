# 📘 Frontend Documentation

## 📌 Project Overview

The project which was collectively worked on is a commonplace where people can share, view and edit personal projects authored by themselves and others.

Technical Stack:

- React Framework

  - JavaScript

  - HTML

  - CSS

- Vite React

  - To enhance the development process with quicker build times.

- Docker

  - To containerize all components within the frontend technical stack for ease of use.

---

## 📁 Folder Structure

frontend/  
|
--> dist/ ### (Conditional) Production build output
|
--> node_modules/ ### All node modules that are currently installed on your system
|
--> src/ ### The projects source files (.jsx, .css, .jpeg)
|
--> assets/ ### Images
|
--> components/ ### Source files for individual sections within the website (Auth, Follow, Navbar, Profile)
|
--> styles/ ### Style files for the website
|
--> utils/ ### External features such as API & Cookie details

---

## 📜 Available Scripts

| Name      | Use-Case                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------- |
| "dev"     | Runs **vite**, starting the development server withquick reload times for local development       |
| "build"   | Runs **vite build**, creating an optrimized production build in the `/dist` folder                |
| "lint"    | Runs **eslint .**, checking code for style and syntax issues using ESLint                         |
| "preview" | Runs **vite preview**, creating the production build locally so it can be tested before deploying |

---

## ♾️ Component Documentation

### Component Table

| Component | Explanation                                                     |
| --------- | --------------------------------------------------------------- |
| Auth      | Handle user authentication (login, signup, password reset, etc) |
| Profile   | Displaying or editing user profiles                             |
| Navbar    | Navigation between different pages of the website               |
| Follow    | Follow functionality of user profiles                           |

### Auth Component Table

| Auth Component | Explanation                              |
| -------------- | ---------------------------------------- |
| Login          | Form for user login w/ form validation   |
| Signup         | Form for user sign up w/ form validation |

### Profile Component Table

| Profile Component | Explanation                                                                      |
| ----------------- | -------------------------------------------------------------------------------- |
| EditProfile       | Edit user profile information and update it accordingly                          |
| Profile           | Default view of user OWN profile                                                 |
| ProjectUpload     | Create a project with the information specified and upload it to the application |
| ViewProfile       | Default view of OTHER users profiles                                             |

### Navbar Component Table

| NavBar Component | Explanation                                           |
| ---------------- | ----------------------------------------------------- |
| NavBar           | Navigation between different pages within the project |

### Follow Component Table

| Follow Component | Explanation                                                         |
| ---------------- | ------------------------------------------------------------------- |
| FollowNetwork    | Manages the social aspect of the applications user following system |

### Commonly used HTML elements

| Name       | Explanation                                                                               | Props                                     |
| ---------- | ----------------------------------------------------------------------------------------- | ----------------------------------------- |
| **h1**     | A text which is applied with h1 level properties                                          | -                                         |
| **button** | An interactable UI component which triggers an event when clicked                         | onClick, type                             |
| **input**  | An interactable UI component which captures and records user input from periphery devices | type, onChange, id, name, required, value |
| **div**    | A logical division of different elements within the layout of a webpage                   | className                                 |

### Prop Table

| Name     | Type     | Default | Description                                                               |
| -------- | -------- | ------- | ------------------------------------------------------------------------- |
| onClick  | function | -       | Triggered when associated element is clicked                              |
| type     | string   | text    | Defines the data type for information used within associated elements     |
| onChange | function | -       | Triggered when associated elements environment changes                    |
| id       | string   | -       | Uniquely identifies and element within the DOM                            |
| name     | string   | -       | The name of the element, used to reference form data after a submit event |
| required | boolean  | false   | Specifies whether the element must be filled out before submitting a form |
| value    | string   | -       | The current value of the element (for controlled components)              |

### Routing

React Router is used for routing in the application. Routing can be found in main.jsx. A table of each the routes is below.
| Path | Component | Description |
|---|---|---|
| / | App | Root path for the application. This is the home page of the application. |
| /signup | Signup | Signup page. |
| /login | Login | Login page. |
| /profile | Profile | Profile page. |
| /edit-profile | Profile | Page for editing the logged in user's profile details. |
| /follow-network | FollowNetwork | Page for viewing who is following the logged in user and the user is following. |
| /project-upload | ProjectUpload | Page for creating new projects on the logged in user's account. |
| /view-profile/:userId | ViewProfile | Page for viewing another user's account. |

### Style Management

The CSS of the project is handled using two global CSS files and module.css files for individual components or sets of components. global.css and theme.css contain CSS styles that apply globally. theme.css specifcally includes variables that are used globally, such as colours and fonts.

## 🪲 Noticeable Bugs

- Following someone on the `/View-profile` page doesn't change the text of the 'Follow' button
- When you aren't following someone on the `/follow-network` page, the button is displayed as 'Requested' when it should be something that makes more senes.
- 'Failed to create project' on the `/profile` page should be more informative as to error correction.
- The error correction details are not visible in the `/signup` and `\login` pages.
