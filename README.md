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
#### Start Minikube
To start the local kubernetes cluster, open a terminal and run:
~~~~
minikube start
~~~~

#### Using Kubectl
Now that we have a cluster running, we can use the **kubectl** to interact with it. Run:
~~~~
minikube status
~~~~
- You should see that host, kubelet, apiserver all running, and the kubectl correctly configured.

For a list of basic commands:
~~~~
kubectl help
~~~~

## Create a deployment
Minikube runs a **single-node** on a VM to which will be the home for any pods that we create. However, it is rare that you will need to create/think about kubernetes in terms on pods. It is recommended that instead you create deployments, which describe the entire desired state of the cluster; including pods.

- Start by creating ```deployment.yml```, this is how we will **describe** the deployment. This is where the VSCode Kubernetes extension will come in handy, although it is not necessary.

Here is the what our first deployment will look like:
~~~~
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: yoloswaggins.azurecr.io/mynodeapp
        ports:
        - containerPort: 3000
      imagePullSecrets:
        - name: azurecr
~~~~
The deployment file we just created was generated using the [kubernetes-api reference](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.15/#deployment-v1-apps) for **deployments**. Following this reference we can see that:

#### kind
- This is how we specify what resource we want to create/update. This could also be a **pod**, but as mentioned before it is better to work in **deployments**.

#### metadata
- **name** - this is what the deployment will be named, and must be unique.

#### spec
- Spec is how we define what sort of behaviour we want this deployment to have. For example, how our pods should be created.
- **selector** - this selector property is used to select which pods should be affected/targeted by this deployment. Any pods with the matching label will be affected.

#### template
- this describes the pods that will be 
created.
- **template - labels** - this is the label that you are assigning to the pods being created. As mentioned in previous steps, this property is what the **selector** selects.

#### spec
- Spec is how we define what sort of behaviour we want the pods to have. This is differentiated from the previous **spec** by its position in the ```deployments.yml``` file. As this comes after the first spec, it is relating to **pod** behaviour, where as the first mention of spec relates to the behaviour of the **deployment**.
- **containers** - this is a list of containers and their corresponding properties that will belong to this pod. You should only list multiple containers if they are tightly coupled.
-- **containers - name** - this is the name that will be given to the container when it is created.
-- **containers - image** - this is the name of the image that you want to use. for example ```myContainerRegistry.azurecr.io/myImage```.
-- **containers - ports** - the port that you want to expose on the container.
-- **imagePullSecrets** - this property should be used when the image you are deployming is located in a private repository. See below on how to create a **secret**.


#### Create a secret - using an image from a private repository (Azure Container Registry)
- To use an image from a private repository, we need some way for the kubernetes-api to use our repository credentials to successfully pull the image.
- We can use **kubectl** to create a secure secret using our credentials like so:
~~~~
kubectl create secret docker-registry my-secrets-name --docker-server=myContainerRegistry.azurecr.io --docker-username=myContainerRegistry --docker-password myPasswordFromAccessKeys --docker-email=myContainerRegistry@email.com
~~~~
- Note: **docker-registry** is a type of secret. If you don't add the required flags, **kubectl** will output an error.

#### Deploy
- Using **kubectl** we can use ```deployment.yml``` to finally deploy our image to the cluster:
~~~~
kubectl create -f deployment.yml --save-config
~~~~
- The ```-f``` flag allows us to create a deployment using our yml file.  
- The ```--save-config``` flag allows us to use the ***apply** command later on to **update** this resource.

Inspect the deployment using:
~~~~
kubectl get deployments
~~~~
- You should see **1/1 Ready** once the image pull has finished. You may have to run this command a few times.  

Inspect the pods using:
~~~~
kubectl get pods
~~~~
- You should see **1/1 Ready** once the image pull has finished. You may have to run this command a few times. 

Finally, lets make sure our app is running as expected by coping the **NAME** that was listed in the previous command and running:
~~~~
kubectl logs myapp-<unique>-<identifier>
~~~~
- This should output:
~~~~
> DeployToKubernetes@1.0.0 start /app
> tsc && node dist/index.js

app listening on port  3000
~~~~
#### Additional
Run the following command for more information about the deployment:
~~~~
kubectl describe deployment myapp
~~~~
- Note: you should see inside the **Pod Template** a container with the name and details you specified in the ```deployment.yml```.

## Expose a deployment
Our app is running, but in order to access it from outside the cluster we need to create a **service**. Following the [Kubernetes Docs](https://kubernetes.io/docs/tasks/access-application-cluster/service-access-application-cluster/) we can do the following.
- Create a service by using the expose command:
~~~~
kubectl expose deployment myapp --type=NodePort --port=3000
~~~~
- Because we are using **Minikube** we need to use the type **NodePort**. This essentially exposes the **node** that our Pods are running on. If you were deployed to a production environment, you would use the type **LoadBalancer**.
- To view your application in the browser run:
~~~~
minikube service myapp
~~~~
- Minikube will open a browser and direct you to your app. You can also run the same command with the **--url** flag which will output the **IP address** of the application instead: 
~~~~
minikube service myapp --url
~~~~

## Updating a deployment
Instead of manually creating this service, lets move it into ```deployment.yml```.
- Here is how we do that:
~~~~
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: yoloswaggins.azurecr.io/mynodeapp
        ports:
        - containerPort: 3000
      imagePullSecrets:
        - name: azurecr
---
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
  ports:
  - port: 3000
    targetPort: 3000
  type: NodePort
~~~~
- About half-way down we added ***---***, which allows us to specify multiple resources.
- You should be able to read through the newly added resource and see that we are creating a **service** of type **NodePort** on port **3000**.  

Lets make use of the **apply** command, so first we want to delete the service we created on our cluster before:
~~~~
kubectl delete service myapp
~~~~
- Now that our deployment no longer has a service, lets run our new ```deployment.yml```:
~~~~
kubectl apply -f deployment.yml
~~~~
- You should see the service being added.
- Again run the following to see the app:
~~~~
kubectl service myapp
~~~~

## Cleaning up
To delete our deployment and service we can either use the delete commands:
~~~~
kubectl delete deployment myapp
kubectl delete service myapp
~~~~
or, we can use our ```deployment.yml```:
~~~~
kubectl delete -f deployment.yml
~~~~
Finally, stop minikube:
~~~~
minikube stop
~~~~

