![Header Image](https://github.com/josno/pawpad-server/blob/master/src/assets/header-img.png?raw=true)

# PawPad Server

#### It's RESTful

The back end interface for the PawPad application. Provides dog information such as name, age, gender, shots and images. This is a constant work in progress and new endpoints are added as I continue to build up this app (per shelter's requests)

## Demo The App [Here](https://pawpad.now.sh/)

## Client Repo [Here](https://github.com/josno/pawpad-client)

## Technology Used

- Server Side Programming:

  - Javascript
  - Node
  - Express
  - Knex

* Relational Databases:

  - SQL
  - PostgreSQL

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

#### Shelter Router || Available Methods:

##### POST

```
/api/v1/shelter
```

#### Dogs Router || Available Methods:

##### GET, POST

```
/api/v1/dogs
```

##### POST

```
/api/v1/dogs/images
```

##### DELETE, PUT

```
/api/v1/dogs/images/:tagNumber
```

#### Dog Id Router || Available Methods:

##### GET, PATCH, DELETE

```
/api/v1/dogs/:dogId
```

---

#####Dog and dog id must exist prior to fetching from the following:

#### Shots Router || Available Methods:

##### GET, POST, DELETE

- Update by dog ID

```
/api/v1/shots
```

##### GET, PATCH

- Update by dog ID

```
/api/v1/shots/dogs/:dogId
```

##### PATCH, DELETE

- For specific shots

```
/api/v1/shots/:shotId
```

#### Notes Router || Available Methods:

##### GET, POST

```
/api/v1/notes/:dogId
```

#### Adoption Router || Available Methods:

##### POST

```
/api/v1/adoption
```

##### GET, DELETE

```
/api/v1/adoption/:dogId
```

#### PUT

```
/api/v1/adoption/contract-upload/:dogId
```
