![Header Image](https://github.com/josno/pawpad-server/blob/master/src/assets/header-img.png?raw=true)

# PawPad Server

#### It's RESTful

The back end interface for the PawPad application. Provides dog information such as name, age, gender, shots and images.

## Demo The App [Here](https://pawpad.now.sh/)

## Client Repo [Here](https://github.com/josno/pawpad-client)

## Technology Used

-   Server Side Programming:

    -   Javascript
    -   Node
    -   Express
    -   Knex

*   Relational Databases:

    -   SQL
    -   PostgreSQL

## How To Use

```
git clone https://github.com/josno/pawpad-server.git

cd pawpad-server

npm i

npm start
```

## Endpoints Breakdown

#### Sign Up || Available Methods:

##### POST: Insert New User

```
/api/v1/users
```

#### Login || Available Methods:

##### POST: User Authentication With JWT

```
/api/v1/auth/
```

#### Dogs Router || Available Methods:

##### GET, POST

```
/api/v1/dogs
```

#### Dog Id Router || Available Methods:

##### PATCH

```
/api/v1/games/:dogId
```

---

#####Dog and dog id must exist prior to fetching from the following:

#### Shots Router || Available Methods:

##### GET, POST

```
/api/v1/shots/:dogId
```

#### Shots Router || Available Methods:

##### PATCH, DELETE

```
/api/v1/shots/:shotId
```

#### Notes Router || Available Methods:

##### GET, POST

```
/api/v1/notes/:dogId
```
