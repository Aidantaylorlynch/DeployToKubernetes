# **Deploying Typescript Express API's To A Kubernetes Cluster**
## Prerequisites
- This example uses [minikube](https://kubernetes.io/docs/setup/learning-environment/minikube/) to run a single-node kubernetes cluster inside a VM on your local machine. 
- [Kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) is a command-line tool that allows you to run commands against a kubernetes cluster. We will be using this to create deployments, and monitor our cluster.

If possible, I recommend following this example on MacOS as setup is much easier. This is because Docker for Windows utilises Hyper-V for create the required linux VM, whereas MacOS uses hyperkit. Minikube supports Hyper-V, but it can be difficult to setup. Minikube has better documented support for hyperkit.

## Recommended
- Install the VSCode [Docker extension](https://code.visualstudio.com/docs/azure/docker) for Dockerfile syntax highlighting.
- Install the VSCode [Kubernetes extension](https://code.visualstudio.com/docs/azure/kubernetes) for deployment spec syntax highlighting, and cluster management.

## Creating an Express API with Typescript
#### Create a new project
- Create a folder for the new project.
- Open a terminal and navigate to the folder that was created and run:
~~~~
npm init --yes
~~~~

#### Install dependencies
- In order to use express and other libraries, install them with npm:
~~~~
npm install --save express
npm install --save-dev nodemon typescript @types/express
~~~~ 

#### Initialise Typescript
- In order to use typescript, create a ```tsconfig.json``` by running:
~~~~
tsc --init
~~~~
- We need to configure ```tsconfig.json``` to work with our project. Add the following configuration:
~~~~
{
  "compilerOptions": {
    "target": "es5",        
    "module": "commonjs", 
    "lib": ["es2015", "dom"],
    "outDir": "dist", 
    "strict": true,                           
    "esModuleInterop": true 
  }
}
~~~~
- Above, we specified that we want our compiled javascript to be put into a folder called ```dist```, and to include both ```es2015``` & ```dom```.

#### Add npm scripts
- In our ```package.json``` we want to create a script to start our project for developement:
~~~~
"scripts": {
    "build": "tsc",
    "dev": "nodemon --legacy-watch -e ts --exec \"npm run start\"",
    "start": "tsc && node dist/index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
~~~~
- The ```dev``` script runs **nodemon** with the **-t** flag, so that whenever a file with the extention ```.ts``` changes, execute ```npm run start```. 
- We also specified ```--legacy-watch```. We need to specify this if we ever want to run this image on a Windows machine as Windows has a different way of emitting file change events.


#### Project structure
- Create a folder called ```src``` at the top level of the project.
- Inside ```src``` create ```index.ts```.
- Add the following lines of code to ```index.ts```:
~~~~
import express from 'express';
import { Request, Response } from 'express';

const app = express();

const port = 3000;

app.get("/", (req: Request, res: Response) => {
    res.send('<h1>express GET "/" hell yeh </h1>');
});

app.listen(port, () => {
    console.log("app listening on port ", port);
});
~~~~

## Creating a Dockerfile
~~~~
FROM node

WORKDIR /app

COPY package*.json /app/

RUN npm install

COPY . /app/

EXPOSE 3000

CMD ["npm", "start"]
~~~~

## Build and tag an image
- To build the following Dockerfile into an image, open a terminal and navigate to where the Dockerfile is located and run:
~~~~
docker build -t myDesiredImageName .
~~~~
- We use the ```-t``` to tag the image we create with a meaningful name.
- You can see the newly created image by running:
~~~~
docker image ls
~~~~

## Push an image to Dockerhub and Azure Container Registry
- In order to push an image to any sort of container registry (Dockerhub, or Azure Container Registry), we need to tag the image in such a way that docker can work out where to push the iamge to. The format to push to Dockerhub is ```myDockerName/myImageName```, and theformat for an Azure Container Registry is ```myContainerRegistryName.azurecr.io/myImageName```.
- To retag the image we created before to either of these formats run:
~~~~
docker tag <sourceImageName> <targetImageName>
~~~~
eg
~~~~
docker tag myTestImage myContainerRegistry.azurecr.io/myTestImage
~~~~
- Now we can login with the Docker CLI and push our image to a repository. Here is how to login to an **Azure Container Registry**. 
~~~~
docker login https://myContainerRegistry.azurecr.io --u myContainerRegistryUserName --p myContainerRegistryPassword
~~~~
- To login into **Docker**, run the following command, and then enter your credentials.
~~~~
docker login
~~~~
- Finally, to push your image to the remote repository run:
~~~~
docker push myContainerRegistry/myImageName
~~~~
- Your image is now available on Dockerhub, or your Azure Container Registry.

## Create a Kubernetes cluster
## Create a deployment
## Expose a deployment
## Updating a deployment
## Cleaning up

